const list = (value, fallback = []) => {
  const source = value === undefined ? fallback.join(',') : value;
  return [...new Set(String(source).split(',').map(item => item.trim()).filter(Boolean))];
};

const boolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const allowedRoles = list(process.env.AUTH_ALLOWED_ROLES, ['admin', 'customer']);
const defaultRole = process.env.AUTH_DEFAULT_ROLE || 'customer';
const managerRoles = list(process.env.AUTH_MANAGER_ROLES, ['admin']);
const assignmentField = (process.env.AUTH_ASSIGNMENT_FIELD || '').trim();

if (!allowedRoles.includes(defaultRole)) {
  throw new Error('AUTH_DEFAULT_ROLE must be included in AUTH_ALLOWED_ROLES');
}

if (managerRoles.some(role => !allowedRoles.includes(role))) {
  throw new Error('Every AUTH_MANAGER_ROLES value must be included in AUTH_ALLOWED_ROLES');
}

if (assignmentField && !/^[A-Za-z_$][\w$]*$/.test(assignmentField)) {
  throw new Error('AUTH_ASSIGNMENT_FIELD must be a valid JavaScript field name');
}

module.exports = Object.freeze({
  allowedRoles,
  defaultRole,
  managerRoles,
  registrationMode: process.env.AUTH_REGISTRATION_MODE === 'manager_only' ? 'manager_only' : 'public',
  allowManagerCreationViaApi: boolean(process.env.AUTH_ALLOW_MANAGER_CREATION_VIA_API),
  managerCreationMessage: process.env.AUTH_MANAGER_CREATION_MESSAGE || 'Cannot register another manager via API',
  deactivatedMessage: process.env.AUTH_DEACTIVATED_MESSAGE || 'Account is deactivated. Contact your manager.',
  assignmentField,
  assignmentRef: process.env.AUTH_ASSIGNMENT_REF || 'Resource',
  assignmentRequiredRoles: list(process.env.AUTH_ASSIGNMENT_REQUIRED_ROLES),
  welcomeBalance: Number(process.env.AUTH_WELCOME_BALANCE || 0),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d'
});
