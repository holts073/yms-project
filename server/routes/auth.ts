import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { getUsers, saveUser, addLog } from '../../src/db/queries';
import { getSetting } from '../../src/db/sqlite';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[BEVEILIGING] JWT_SECRET is niet ingesteld als omgevingsvariabele. Server start geannuleerd.');
}
const JWT_SECRET_RESOLVED = JWT_SECRET || 'fallback_secret_key_for_dev_only';

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== "string" || !password) {
    return res.status(400).json({ error: "Email en wachtwoord verplicht." });
  }
  const users = getUsers();
  const user = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || (!user.passwordHash && password !== 'welkom123')) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  let isValid = false;
  try {
    if (user.passwordHash && user.passwordHash.startsWith('$2')) {
      isValid = bcrypt.compareSync(password, user.passwordHash);
    } else {
      isValid = password === 'welkom123';
    }
  } catch (err) {
    isValid = password === 'welkom123';
  }

  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // 2FA Stage (v3.14.0)
  if (user.twoFactorEnabled) {
    // Generate a temporary 2FA-only token or session
    const tempToken = jwt.sign({ id: user.id, email: user.email, is2faPending: true }, JWT_SECRET_RESOLVED, { expiresIn: '5m' });
    return res.json({ 
      twoFactorRequired: true, 
      tempToken,
      user: { id: user.id, email: user.email, name: user.name } 
    });
  }

  // Auto-set requiresReset if using default password
  if (!user.passwordHash && password === 'welkom123' && !user.requiresReset) {
    saveUser({ ...user, requiresReset: true });
  }

  const expiresIn = (user.role === 'operator' || user.role === 'lead_operator') ? '365d' : '1h';
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET_RESOLVED, { expiresIn });
  const { passwordHash, ...safeUser } = user;

  // Add the current value of requiresReset to the response (might have been updated above)
  const usersUpdated = getUsers();
  const userUpdated = usersUpdated.find(u => u.id === user.id);
  
  addLog({
    timestamp: new Date().toISOString(),
    user: user.name,
    action: "Login Successful",
    details: `User logged in from ${req.ip}`
  });

  res.json({ token, user: { ...safeUser, requiresReset: userUpdated?.requiresReset || false } });
});

router.post("/verify-2fa", (req, res) => {
  const { code, tempToken } = req.body;
  if (!code || !tempToken) return res.status(400).json({ error: "Code en token verplicht." });

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET_RESOLVED) as any;
    if (!decoded.is2faPending) throw new Error("Invalid session");

    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error("2FA niet geactiveerd voor deze gebruiker.");
    }

    const isValid = speakeasy.totp.verify({ 
      token: code, 
      secret: user.twoFactorSecret,
      encoding: 'base32'
    });
    if (!isValid) return res.status(401).json({ error: "Ongeldige 2FA code." });

    const expiresIn = (user.role === 'operator' || user.role === 'lead_operator') ? '365d' : '1h';
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET_RESOLVED, { expiresIn });
    const { passwordHash, twoFactorSecret, ...safeUser } = user;

    addLog({
      timestamp: new Date().toISOString(),
      user: user.name,
      action: "2FA Succesvol",
      details: `User logged in via 2FA`
    });

    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(401).json({ error: "Sessie verlopen of ongeldig." });
  }
});

router.post("/setup-2fa", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Niet geautoriseerd" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET_RESOLVED) as any;
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    const secret = speakeasy.generateSecret({ name: `ILG Control Tower (${user.email})` });
    
    QRCode.toDataURL(secret.otpauth_url!, (err, imageUrl) => {
      if (err) return res.status(500).json({ error: "QR Error" });
      res.json({ secret: secret.base32, qrCode: imageUrl });
    });
  } catch (err) {
    res.status(401).json({ error: "Token ongeldig" });
  }
});

router.post("/confirm-2fa", (req, res) => {
  const { secret, code } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token!, JWT_SECRET_RESOLVED) as any;
    const isValid = speakeasy.totp.verify({ 
      token: code, 
      secret,
      encoding: 'base32'
    });
    if (!isValid) return res.status(400).json({ error: "Ongeldige verificatiecode" });

    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) throw new Error("User not found");

    saveUser({ ...user, twoFactorSecret: secret, twoFactorEnabled: true });
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Verificatie mislukt" });
  }
});

router.post("/disable-2fa", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token!, JWT_SECRET_RESOLVED) as any;
    const users = getUsers();
    const user = users.find(u => u.id === decoded.id);
    if (!user) throw new Error("User not found");

    saveUser({ ...user, twoFactorSecret: undefined, twoFactorEnabled: false });
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Mislukt" });
  }
});

router.post("/admin/reset-2fa", (req, res) => {
  const { userId } = req.body;
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token!, JWT_SECRET_RESOLVED) as any;
    if (decoded.role !== 'admin') return res.status(403).json({ error: "Alleen admins" });

    const users = getUsers();
    const userToReset = users.find(u => u.id === userId);
    if (!userToReset) return res.status(404).json({ error: "Gebruiker niet gevonden" });

    saveUser({ ...userToReset, twoFactorSecret: undefined, twoFactorEnabled: false });
    
    addLog({
      timestamp: new Date().toISOString(),
      user: decoded.name,
      action: "Admin 2FA Reset",
      details: `2FA gereset voor gebruiker ${userToReset.name}`
    });

    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: "Mislukt" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Ongeldig e-mailadres." });
  }
  const users = getUsers();
  const user = users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: "Gebruiker niet gevonden" });
  }

  const companySettings = getSetting('companySettings', {});
  const mailServer = companySettings?.mailServer;

  if (!mailServer || !mailServer.host || !mailServer.port || !mailServer.user || !mailServer.pass) {
    return res.status(500).json({ error: "SMTP instellingen zijn niet geconfigureerd" });
  }

  try {
    const tempPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(tempPassword, salt);
    
    saveUser({ ...user, passwordHash: newHash });

    const transporter = nodemailer.createTransport({
      host: mailServer.host,
      port: mailServer.port,
      secure: mailServer.port === 465,
      auth: {
        user: mailServer.user,
        pass: mailServer.pass
      }
    });

    await transporter.sendMail({
      from: mailServer.from || mailServer.user,
      to: email,
      subject: "Wachtwoord Reset - ILG Foodgroup YMS",
      text: `Beste ${user.name},\n\nUw wachtwoord is gereset. Uw nieuwe tijdelijke wachtwoord is: ${tempPassword}\n\nWe raden u aan dit direct na het inloggen te wijzigen.\n\nMet vriendelijke groet,\nILG Foodgroup YMS`
    });

    addLog({
      timestamp: new Date().toISOString(),
      user: "SYSTEM",
      action: "Password Reset Request",
      details: `Password reset sent to ${email}`
    });

    res.json({ success: true, message: "Wachtwoord gereset. Controleer uw e-mail." });
  } catch (error) {
    console.error("SMTP Error:", error);
    res.status(500).json({ error: "Fout bij verzenden email (SMTP fout)" });
  }
});

export default router;
