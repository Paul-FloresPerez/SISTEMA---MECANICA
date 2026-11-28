import { hash } from '@node-rs/argon2';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Administrative operation; callers must protect access to the database connection. */
export async function resetAdmin(pool, organizationId, username, password) {
  if (typeof organizationId !== 'string' || !uuid.test(organizationId) || typeof username !== 'string' || !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username) || typeof password !== 'string' || password.length < 12 || password.length > 1024) throw new Error('Datos inválidos.');
  const passwordHash = await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query('SELECT id FROM organizations WHERE id=$1 FOR UPDATE', [organizationId]);
    if (org.rowCount !== 1) throw new Error('Administrador activo no encontrado en la organización indicada.');
    const target = await client.query("SELECT u.id, m.workshop_id FROM users u JOIN memberships m ON m.user_id=u.id JOIN workshops w ON w.id=m.workshop_id AND w.organization_id=m.organization_id WHERE u.username=$1 AND u.is_active AND m.organization_id=$2 AND m.role='admin' AND m.is_active AND w.is_active FOR UPDATE OF u,m", [username, organizationId]);
    if (target.rowCount !== 1) throw new Error('Administrador activo no encontrado en la organización indicada.');
    const userId = target.rows[0].id;
    const memberships = await client.query('SELECT id FROM memberships WHERE user_id=$1 LIMIT 2', [userId]);
    if (memberships.rowCount !== 1) throw new Error('La cuenta compartida entre organizaciones requiere un procedimiento individual.');
    const changed = await client.query('UPDATE user_credentials SET password_hash=$1,must_change_password=true,password_changed_at=now(),failed_attempts=0,locked_until=NULL WHERE user_id=$2 RETURNING user_id', [passwordHash, userId]);
    if (changed.rowCount !== 1) throw new Error('No se encontraron las credenciales del administrador.');
    await client.query('UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL', [userId]);
    await client.query("INSERT INTO audit_logs(organization_id,workshop_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES($1,$2,NULL,'user.emergency_password_reset','user',$3,$4::jsonb)", [organizationId, target.rows[0].workshop_id, userId, JSON.stringify({ method: 'private_terminal' })]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
