import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { getUsers, saveUser } from '../../src/db/queries';
import { db, dbReady } from '../../src/db/sqlite';

describe('Authentication & Security', () => {
    beforeAll(async () => {
        await dbReady;
    });
    beforeEach(() => {
        // Re-seed specific test user
        db.prepare('DELETE FROM users WHERE id = ?').run('test-admin');
        db.prepare('INSERT INTO users (id, name, email, passwordHash, role, requiresReset) VALUES (?, ?, ?, ?, ?, ?)').run(
            'test-admin', 'Admin', 'test-admin@ilgfood.com', 'dummy-hash', 'admin', 0
        );
    });

    it('should retrieve users with requiresReset as boolean', () => {
        const users = getUsers();
        const admin = users.find(u => u.id === 'test-admin');
        expect(admin).toBeDefined();
        expect(typeof admin?.requiresReset).toBe('boolean');
        expect(admin?.requiresReset).toBe(false);
    });

    it('should correctly save and retrieve requiresReset flag', () => {
        const admin = getUsers().find(u => u.id === 'test-admin')!;
        saveUser({ ...admin, requiresReset: true });
        
        const updated = getUsers().find(u => u.id === 'test-admin')!;
        expect(updated.requiresReset).toBe(true);
    });

    it('should maintain the flag when saving without explicit change', () => {
        const admin = getUsers().find(u => u.id === 'test-admin')!;
        saveUser({ ...admin, requiresReset: true });
        
        // Save again without specifying requiresReset
        const { requiresReset, ...rest } = getUsers().find(u => u.id === 'test-admin')!;
        saveUser(rest as any);

        const final = getUsers().find(u => u.id === 'test-admin')!;
        expect(final.requiresReset).toBe(true);
    });
});
