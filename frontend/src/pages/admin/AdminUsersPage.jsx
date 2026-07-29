import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';

import {
  useAuth,
} from '../../contexts/AuthContext.jsx';

import {
  createAdminUser,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
  updateAdminUserStatus,
} from '../../services/adminUsers.service.js';

import AdminUserFormModal from '../../components/admin/AdminUserFormModal.jsx';
import AdminUserEditModal from '../../components/admin/AdminUserEditModal.jsx';
import AdminUserPasswordModal from '../../components/admin/AdminUserPasswordModal.jsx';
import AdminUserStatusModal from '../../components/admin/AdminUserStatusModal.jsx';

import '../../styles/admin-users.css';

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Sin fecha';
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(date.getTime())
  ) {
    return 'Fecha inválida';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(date);
}

export default function AdminUsersPage() {
  const {
    user,
    logout,
  } = useAuth();

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

const [
  isCreateModalOpen,
  setIsCreateModalOpen,
] = useState(false);

const [
  editingUser,
  setEditingUser,
] = useState(null);

const [
  statusUser,
  setStatusUser,
] = useState(null);

const [
  passwordUser,
  setPasswordUser,
] = useState(null);

const [
  successMessage,
  setSuccessMessage,
] = useState('');

  const loadUsers =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const result =
          await getAdminUsers();

        setUsers(
          Array.isArray(result.usuarios)
            ? result.usuarios
            : [],
        );
      } catch (requestError) {
        console.error(
          'Error cargando cuentas:',
          requestError,
        );

        setError(
          requestError.message ||
            'No fue posible cargar las cuentas.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreateUser(
  userData,
) {
  setError('');
  setSuccessMessage('');

  const result =
    await createAdminUser(userData);

  setUsers((currentUsers) => [
    result.usuario,
    ...currentUsers,
  ]);

  setIsCreateModalOpen(false);

  setSuccessMessage(
    `La cuenta de ${result.usuario.nombre} se creó correctamente.`,
  );
}

async function handleCreateUser(
  userData,
) {
  setError('');
  setSuccessMessage('');

  const result =
    await createAdminUser(userData);

  setUsers((currentUsers) => [
    result.usuario,
    ...currentUsers,
  ]);

  setIsCreateModalOpen(false);

  setSuccessMessage(
    `La cuenta de ${result.usuario.nombre} se creó correctamente.`,
  );
}

async function handleEditUser(
  userData,
) {
  if (!editingUser) {
    return;
  }

  setError('');
  setSuccessMessage('');

  const result =
    await updateAdminUser(
      editingUser.id,
      userData,
    );

  setUsers((currentUsers) =>
    currentUsers.map((account) =>
      String(account.id) ===
      String(result.usuario.id)
        ? result.usuario
        : account,
    ),
  );

  setEditingUser(null);

  setSuccessMessage(
    `La cuenta de ${result.usuario.nombre} se actualizó correctamente.`,
  );
}

async function handleChangeStatus(
  estado,
) {
  if (!statusUser) {
    return;
  }

  setError('');
  setSuccessMessage('');

  const result =
    await updateAdminUserStatus(
      statusUser.id,
      estado,
    );

  setUsers((currentUsers) =>
    currentUsers.map((account) =>
      String(account.id) ===
      String(result.usuario.id)
        ? result.usuario
        : account,
    ),
  );

  setStatusUser(null);

  setSuccessMessage(
    result.message ||
      'El estado se actualizó correctamente.',
  );
}

async function handleResetPassword(
  passwordData,
) {
  if (!passwordUser) {
    return;
  }

  const accountName =
    passwordUser.nombre;

  setError('');
  setSuccessMessage('');

  const result =
    await resetAdminUserPassword(
      passwordUser.id,
      passwordData,
    );

  setPasswordUser(null);

  setSuccessMessage(
    result.message ||
      `La contraseña de ${accountName} se restableció correctamente.`,
  );
}

  const indicators =
    useMemo(() => {
      const total =
        users.length;

      const active =
        users.filter(
          (account) =>
            account.estado === 'ACTIVO',
        ).length;

      const inactive =
        users.filter(
          (account) =>
            account.estado === 'INACTIVO',
        ).length;

      const admins =
        users.filter(
          (account) =>
            account.rol === 'ADMIN',
        ).length;

      return {
        total,
        active,
        inactive,
        admins,
      };
    }, [users]);

  const filteredUsers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return users;
      }

      return users.filter(
        (account) => {
          const searchableText = [
            account.nombre,
            account.correo,
            account.rol,
            account.estado,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      users,
      search,
    ]);

  return (
    <div className="admin-users-page">
      <header className="admin-users-navbar">
        <div className="admin-users-brand">
          <span className="admin-users-brand__logo">
            TB
          </span>

          <div>
            <strong>
              TASK BLOQ
            </strong>

            <small>
              Administración
            </small>
          </div>
        </div>

        <div className="admin-users-session">
          <div>
            <strong>
              {user?.name}
            </strong>

            <small>
              {user?.email}
            </small>
          </div>

          <button
            type="button"
            onClick={logout}
            className="admin-users-logout"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="admin-users-content">
        <section className="admin-users-heading">
          <div>
            <h1>
              Administración de usuarios
            </h1>

            <p>
              Crea y administra las cuentas
              que tendrán acceso a TASK BLOQ.
            </p>
          </div>

          <button
            type="button"
            className="admin-users-primary-button"
            onClick={() => {
                setSuccessMessage('');
                setIsCreateModalOpen(true);
            }}
          >
            <Plus size={19} />
            Nueva cuenta
          </button>
        </section>

        {successMessage && (
        <div
        className="admin-users-alert admin-users-alert--success"
        role="status"
        >
            {successMessage}
        </div>
        )}

        <section
          className="admin-users-indicators"
          aria-label="Indicadores de cuentas"
        >
          <article>
            <Users size={21} />

            <div>
              <span>
                Total
              </span>

              <strong>
                {indicators.total}
              </strong>
            </div>
          </article>

          <article>
            <UserCheck size={21} />

            <div>
              <span>
                Activas
              </span>

              <strong>
                {indicators.active}
              </strong>
            </div>
          </article>

          <article>
            <UserX size={21} />

            <div>
              <span>
                Inactivas
              </span>

              <strong>
                {indicators.inactive}
              </strong>
            </div>
          </article>

          <article>
            <ShieldCheck size={21} />

            <div>
              <span>
                Administradores
              </span>

              <strong>
                {indicators.admins}
              </strong>
            </div>
          </article>
        </section>

        <section className="admin-users-panel">
          <header className="admin-users-panel__header">
            <div className="admin-users-search">
              <Search
                size={19}
                aria-hidden="true"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar por nombre, correo, rol o estado"
                aria-label="Buscar cuentas"
              />
            </div>

            <button
              type="button"
              className="admin-users-refresh"
              onClick={loadUsers}
              disabled={loading}
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? 'admin-users-spin'
                    : ''
                }
              />

              Actualizar
            </button>
          </header>

          {error && (
            <div
              className="admin-users-alert admin-users-alert--error"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="admin-users-empty">
              Cargando cuentas...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty">
              No se encontraron cuentas.
            </div>
          ) : (
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>
                      Usuario
                    </th>

                    <th>
                      Rol
                    </th>

                    <th>
                      Estado
                    </th>

                    <th>
                      Fecha de creación
                    </th>

                    <th>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="admin-users-person">
                            <span>
                              {account.nombre
                                ?.charAt(0)
                                .toUpperCase() ||
                                'U'}
                            </span>

                            <div>
                              <strong>
                                {account.nombre}
                              </strong>

                              <small>
                                {account.correo}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`admin-users-role admin-users-role--${account.rol.toLowerCase()}`}
                          >
                            {account.rol}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-users-status admin-users-status--${account.estado.toLowerCase()}`}
                          >
                            {account.estado}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            account.creadoEn,
                          )}
                        </td>

                        <td>
                          <div className="admin-users-actions">
                            <button
  type="button"
  className="admin-users-action admin-users-action--edit"
  onClick={() => {
    setSuccessMessage('');
    setEditingUser(account);
  }}
>
  Editar
</button>

<button
  type="button"
  className="admin-users-action admin-users-action--password"
  onClick={() => {
    setSuccessMessage('');
    setPasswordUser(account);
  }}
>
  Contraseña
</button>

<button
  type="button"
  className={`admin-users-action ${
    account.estado === 'ACTIVO'
      ? 'admin-users-action--danger'
      : 'admin-users-action--activate'
  }`}
  onClick={() => {
    setSuccessMessage('');
    setStatusUser(account);
  }}
>
  {account.estado === 'ACTIVO'
    ? 'Desactivar'
    : 'Activar'}
</button>

                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
            </main>

      <AdminUserFormModal
  isOpen={isCreateModalOpen}
  onClose={() =>
    setIsCreateModalOpen(false)
  }
  onSubmit={handleCreateUser}
/>

<AdminUserEditModal
  isOpen={Boolean(editingUser)}
  user={editingUser}
  onClose={() =>
    setEditingUser(null)
  }
  onSubmit={handleEditUser}
/>

<AdminUserStatusModal
  isOpen={Boolean(statusUser)}
  user={statusUser}
  currentUserId={user?.id}
  onClose={() =>
    setStatusUser(null)
  }
  onConfirm={handleChangeStatus}
/>

<AdminUserPasswordModal
  isOpen={Boolean(passwordUser)}
  user={passwordUser}
  onClose={() =>
    setPasswordUser(null)
  }
  onSubmit={handleResetPassword}
/>

    </div>

  );
}