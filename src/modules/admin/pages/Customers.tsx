import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, Ban, X } from "lucide-react";
import {
  getCustomers,
  getDocumentTypes,
  createCustomer,
  updateCustomer,
  blacklistCustomer,
  deleteCustomer,
} from "../../../services/customerService";
import type {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
  CustomerStatus,
  DocumentType,
  DocumentTypeInfo,
} from "../../../types/api";
import { ApiError } from "../../../lib/api";

interface FormErrors {
  firstName?: string;
  firstSurname?: string;
  email?: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CreateCustomerPayload>({
    name: {
      firstName: "",
      firstSurname: "",
    },
    email: "",
    phone: "",
    documentType: "cc",
    documentNumber: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch document types
  useEffect(() => {
    const fetchDocTypes = async () => {
      try {
        const response = await getDocumentTypes();
        setDocumentTypes(response.data.documentTypes);
      } catch (err) {
        console.error("Failed to fetch document types:", err);
        // Fallback to default types if API fails
        setDocumentTypes([
          { value: "cc", displayName: "Colombian National ID", description: "Colombian National ID" },
          { value: "ce", displayName: "Colombian Foreign ID", description: "Colombian Foreign ID" },
          { value: "passport", displayName: "Passport", description: "International Passport" },
          { value: "nit", displayName: "NIT", description: "Tax Identification Number" },
          { value: "other", displayName: "Other", description: "Other identification type" },
        ]);
      } finally {
        setLoadingDocTypes(false);
      }
    };
    void fetchDocTypes();
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getCustomers({
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setCustomers(response.data.customers);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Error loading customers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  // Validation
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.firstName.trim()) {
      errors.firstName = "El nombre es requerido";
    } else if (formData.name.firstName.length > 50) {
      errors.firstName = "Maximum 50 characters";
    }

    if (!formData.name.firstSurname.trim()) {
      errors.firstSurname = "El apellido es requerido";
    } else if (formData.name.firstSurname.length > 50) {
      errors.firstSurname = "Maximum 50 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Invalid email";
    }

    // E.164 format: +[country code][number]
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      errors.phone = "Invalid format (e.g: +573001234567)";
    }

    if (!formData.documentNumber.trim()) {
      errors.documentNumber = "Document number is required";
    } else if (formData.documentNumber.length > 50) {
      errors.documentNumber = "Máximo 50 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create customer
  const handleCreate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createCustomer(formData);
      setShowCreateModal(false);
      resetForm();
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create customer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Update customer
  const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer || !validateForm()) return;

    setSubmitting(true);
    try {
      const payload: UpdateCustomerPayload = {
        name: {
          firstName: formData.name.firstName,
          firstSurname: formData.name.firstSurname,
          secondName: formData.name.secondName,
          secondSurname: formData.name.secondSurname,
        },
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };
      await updateCustomer(selectedCustomer._id, payload);
      setShowEditModal(false);
      resetForm();
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update customer";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Blacklist customer
  const handleBlacklist = async (customer: Customer) => {
    if (!confirm(`Block ${customer.name.firstName} ${customer.name.firstSurname}?`)) return;

    try {
      await blacklistCustomer(customer._id);
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to blacklist customer";
      alert(message);
    }
  };

  // Delete customer
  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete ${customer.name.firstName} ${customer.name.firstSurname}?`)) return;

    try {
      await deleteCustomer(customer._id);
      await fetchCustomers();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete customer";
      alert(message);
    }
  };

  // Open edit modal
  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: {
        firstName: customer.name.firstName,
        firstSurname: customer.name.firstSurname,
        secondName: customer.name.secondName,
        secondSurname: customer.name.secondSurname,
      },
      email: customer.email,
      phone: customer.phone,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      address: customer.address,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: {
        firstName: "",
        firstSurname: "",
      },
      email: "",
      phone: "",
      documentType: documentTypes[0]?.value || "cc",
      documentNumber: "",
    });
    setFormErrors({});
    setSelectedCustomer(null);
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Activo</span>;
      case "inactive":
        return <span className="badge badge-warning">Inactivo</span>;
      case "blacklisted":
        return <span className="badge badge-danger">Bloqueado</span>;
    }
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType?.displayName || type;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-gray-400">Manage your organization's customers</p>
        </div>

        {/* Global Error */}
        {error && (
          <div className="card mb-6 bg-red-500/10 border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o documento..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as CustomerStatus | "");
                setCurrentPage(1);
              }}
              className="input md:w-48"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="blacklisted">Bloqueados</option>
            </select>

            {/* Create Button */}
            <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={20} />
              Nuevo Cliente
            </button>
          </div>
        </div>

        {/* Table */}
        {loading || loadingDocTypes ? (
          <div className="card flex items-center justify-center py-12">
            <div className="spinner w-8 h-8"></div>
            <p className="mt-4 text-gray-400">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">No customers found</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="font-medium text-white">
                        {customer.name.firstName} {customer.name.firstSurname}
                      </td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>
                        <div className="text-xs">
                          <div className="text-gray-500">{getDocumentTypeLabel(customer.documentType)}</div>
                          <div>{customer.documentNumber}</div>
                        </div>
                      </td>
                      <td>{getStatusBadge(customer.status)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(customer)}
                            className="btn-icon text-blue-400 hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          {customer.status !== "blacklisted" && (
                            <button
                              onClick={() => void handleBlacklist(customer)}
                              className="btn-icon text-yellow-400 hover:text-yellow-300"
                              title="Bloquear"
                            >
                              <Ban size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => void handleDelete(customer)}
                            className="btn-icon text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {(currentPage - 1) * 10 + 1} - {Math.min(currentPage * 10, total)} of {total} customers
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary text-sm"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-400">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateModal(false);
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-xl font-bold">Crear Nuevo Cliente</h2>
                <button onClick={() => setShowCreateModal(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Primer Nombre *</label>
                      <input
                        type="text"
                        value={formData.name.firstName}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, firstName: e.target.value } })}
                        className={`input ${formErrors.firstName ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.firstName && <p className="form-error">{formErrors.firstName}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Segundo Nombre</label>
                      <input
                        type="text"
                        value={formData.name.secondName || ""}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, secondName: e.target.value } })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Primer Apellido *</label>
                      <input
                        type="text"
                        value={formData.name.firstSurname}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, firstSurname: e.target.value } })}
                        className={`input ${formErrors.firstSurname ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.firstSurname && <p className="form-error">{formErrors.firstSurname}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formData.name.secondSurname || ""}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, secondSurname: e.target.value } })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`input ${formErrors.email ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.email && <p className="form-error">{formErrors.email}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono * (formato E.164)</label>
                      <input
                        type="tel"
                        placeholder="+573001234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`input ${formErrors.phone ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Document */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Tipo de Documento *</label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                        className="input"
                        disabled={submitting}
                      >
                        {documentTypes.map((docType) => (
                          <option key={docType.value} value={docType.value}>
                            {docType.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número de Documento *</label>
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                        className={`input ${formErrors.documentNumber ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.documentNumber && <p className="form-error">{formErrors.documentNumber}</p>}
                    </div>
                  </div>

                  {/* Address (optional) */}
                  <div className="form-group">
                    <label className="form-label">Address (optional)</label>
                    <input
                      type="text"
                      placeholder="Street, city, country..."
                      value={formData.address?.street || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                      className="input"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Customer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedCustomer && (
          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="text-xl font-bold">Editar Cliente</h2>
                <button onClick={() => setShowEditModal(false)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate}>
                <div className="modal-body space-y-4">
                  {/* Name */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Primer Nombre *</label>
                      <input
                        type="text"
                        value={formData.name.firstName}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, firstName: e.target.value } })}
                        className={`input ${formErrors.firstName ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.firstName && <p className="form-error">{formErrors.firstName}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Segundo Nombre</label>
                      <input
                        type="text"
                        value={formData.name.secondName || ""}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, secondName: e.target.value } })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Primer Apellido *</label>
                      <input
                        type="text"
                        value={formData.name.firstSurname}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, firstSurname: e.target.value } })}
                        className={`input ${formErrors.firstSurname ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.firstSurname && <p className="form-error">{formErrors.firstSurname}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formData.name.secondSurname || ""}
                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, secondSurname: e.target.value } })}
                        className="input"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`input ${formErrors.email ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.email && <p className="form-error">{formErrors.email}</p>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono * (formato E.164)</label>
                      <input
                        type="tel"
                        placeholder="+573001234567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={`input ${formErrors.phone ? "input-error" : ""}`}
                        disabled={submitting}
                      />
                      {formErrors.phone && <p className="form-error">{formErrors.phone}</p>}
                    </div>
                  </div>

                  {/* Document (read-only in edit) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                    <div className="form-group">
                      <label className="form-label">Tipo de Documento</label>
                      <input type="text" value={getDocumentTypeLabel(selectedCustomer.documentType)} className="input" disabled />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número de Documento</label>
                      <input type="text" value={selectedCustomer.documentNumber} className="input" disabled />
                    </div>
                  </div>

                  {/* Address (optional) */}
                  <div className="form-group">
                    <label className="form-label">Dirección (opcional)</label>
                    <input
                      type="text"
                      placeholder="Calle, ciudad, país..."
                      value={formData.address?.street || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value },
                        })
                      }
                      className="input"
                      disabled={submitting}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={submitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
