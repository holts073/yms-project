import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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

  const isValid = user.passwordHash 
    ? bcrypt.compareSync(password, user.passwordHash)
    : password === 'welkom123';

  if (!isValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const expiresIn = user.role === 'tablet' ? '365d' : '1h';
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET_RESOLVED, { expiresIn });
  const { passwordHash, ...safeUser } = user;

  addLog({
    timestamp: new Date().toISOString(),
    user: user.name,
    action: "Login Successful",
    details: `User logged in from ${req.ip}`
  });

  res.json({ token, user: safeUser });
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
