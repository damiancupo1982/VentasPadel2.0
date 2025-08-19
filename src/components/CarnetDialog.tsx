import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, User, Users, Save, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { CarnetFormData, SocioMember, BARRIOS_DISPONIBLES, CONDICIONES_DISPONIBLES, VINCULOS_DISPONIBLES } from '../types/carnets';

interface CarnetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carnetData: CarnetFormData) => void;
}

const CarnetDialog: React.FC<CarnetDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<CarnetFormData>({
    lote: '',
    barrio: '',
    tipo: 'INDIVIDUAL',
    titular: {
      lote: '',
      condicion: 'TITULAR',
      nombreCompleto: '',
      telefono: '',
      dni: '',
      email: '',
      barrio: '',
      vinculo: 'TITULAR',
      fechaAlta: new Date().toISOString(),
      estado: 'ACTIVO'
    },
    familiares: [],
    observaciones: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      lote: '',
      barrio: '',
      tipo: 'INDIVIDUAL',
      titular: {
        lote: '',
        condicion: 'TITULAR',
        nombreCompleto: '',
        telefono: '',
        dni: '',
        email: '',
        barrio: '',
        vinculo: 'TITULAR',
        fechaAlta: new Date().toISOString(),
        estado: 'ACTIVO'
      },
      familiares: [],
      observaciones: ''
    });
    setErrors({});
  };

  const handleTipoChange = (tipo: 'INDIVIDUAL' | 'FAMILIAR') => {
    setFormData({
      ...formData,
      tipo,
      familiares: tipo === 'INDIVIDUAL' ? [] : formData.familiares
    });
  };

  const addFamiliar = () => {
    if (formData.familiares.length >= 4) return; // Máximo 4 familiares + 1 titular = 5 total
    
    const nextCondicion = getNextCondicion();
    if (!nextCondicion) return;

    const newFamiliar: Omit<SocioMember, 'id' | 'createdAt' | 'updatedAt'> = {
      lote: formData.lote,
      condicion: nextCondicion,
      nombreCompleto: '',
      telefono: '',
      dni: '',
      email: '',
      barrio: formData.barrio,
      vinculo: 'FAMILIAR',
      fechaAlta: new Date().toISOString(),
      estado: 'ACTIVO'
    };

    setFormData({
      ...formData,
      familiares: [...formData.familiares, newFamiliar]
    });
  };

  const removeFamiliar = (index: number) => {
    setFormData({
      ...formData,
      familiares: formData.familiares.filter((_, i) => i !== index)
    });
  };

  const updateTitular = (field: keyof Omit<SocioMember, 'id' | 'createdAt' | 'updatedAt'>, value: string) => {
    setFormData({
      ...formData,
      titular: {
        ...formData.titular,
        [field]: value
      }
    });
    
    // Sincronizar lote y barrio
    if (field === 'lote') {
      setFormData(prev => ({
        ...prev,
        lote: value,
        titular: { ...prev.titular, lote: value },
        familiares: prev.familiares.map(f => ({ ...f, lote: value }))
      }));
    }
    
    if (field === 'barrio') {
      setFormData(prev => ({
        ...prev,
        barrio: value,
        titular: { ...prev.titular, barrio: value },
        familiares: prev.familiares.map(f => ({ ...f, barrio: value }))
      }));
    }
  };

  const updateFamiliar = (index: number, field: keyof Omit<SocioMember, 'id' | 'createdAt' | 'updatedAt'>, value: string) => {
    const updatedFamiliares = [...formData.familiares];
    updatedFamiliares[index] = {
      ...updatedFamiliares[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      familiares: updatedFamiliares
    });
  };

  const getNextCondicion = (): 'FAMILIAR_1' | 'FAMILIAR_2' | 'FAMILIAR_3' | 'FAMILIAR_ADHERENTE' | null => {
    const usedCondiciones = formData.familiares.map(f => f.condicion);
    const availableCondiciones = ['FAMILIAR_1', 'FAMILIAR_2', 'FAMILIAR_3', 'FAMILIAR_ADHERENTE'] as const;
    return availableCondiciones.find(c => !usedCondiciones.includes(c)) || null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones del titular
    if (!formData.titular.nombreCompleto.trim()) {
      newErrors['titular-nombre'] = 'El nombre completo es obligatorio';
    }
    
    if (!formData.titular.telefono.trim()) {
      newErrors['titular-telefono'] = 'El teléfono es obligatorio';
    }
    
    if (!formData.titular.dni.trim()) {
      newErrors['titular-dni'] = 'El DNI es obligatorio';
    } else if (!/^\d{7,8}$/.test(formData.titular.dni)) {
      newErrors['titular-dni'] = 'El DNI debe tener 7 u 8 dígitos';
    }
    
    if (!formData.titular.email.trim()) {
      newErrors['titular-email'] = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.titular.email)) {
      newErrors['titular-email'] = 'El email no es válido';
    }
    
    if (!formData.lote.trim()) {
      newErrors['lote'] = 'El número de lote es obligatorio';
    }
    
    if (!formData.barrio.trim()) {
      newErrors['barrio'] = 'El barrio es obligatorio';
    }

    // Validaciones de familiares
    formData.familiares.forEach((familiar, index) => {
      if (!familiar.nombreCompleto.trim()) {
        newErrors[`familiar-${index}-nombre`] = 'El nombre es obligatorio';
      }
      
      if (!familiar.telefono.trim()) {
        newErrors[`familiar-${index}-telefono`] = 'El teléfono es obligatorio';
      }
      
      if (familiar.dni.trim() && !/^\d{7,8}$/.test(familiar.dni)) {
        newErrors[`familiar-${index}-dni`] = 'El DNI debe tener 7 u 8 dígitos';
      }
      
      if (familiar.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(familiar.email)) {
        newErrors[`familiar-${index}-email`] = 'El email no es válido';
      }
    });

    // Validar DNIs únicos
    const allDnis = [
      formData.titular.dni,
      ...formData.familiares.map(f => f.dni)
    ].filter(dni => dni.trim());
    
    const duplicatedDnis = allDnis.filter((dni, index) => allDnis.indexOf(dni) !== index);
    if (duplicatedDnis.length > 0) {
      newErrors['dni-duplicated'] = 'Hay DNIs duplicados';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
  };

  if (!isOpen) return null;

  const canAddFamiliar = formData.tipo === 'FAMILIAR' && formData.familiares.length < 4 && getNextCondicion();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl bg-white rounded-lg shadow-xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
          <h2 className="text-lg font-semibold flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-600" />
            Nuevo Carnet de Socio
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Configuración General */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Información General</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Número de Lote *
                </label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) => updateTitular('lote', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['lote'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123"
                />
                {errors['lote'] && <p className="mt-1 text-sm text-red-600">{errors['lote']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barrio *
                </label>
                <select
                  value={formData.barrio}
                  onChange={(e) => updateTitular('barrio', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['barrio'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar barrio</option>
                  {BARRIOS_DISPONIBLES.map(barrio => (
                    <option key={barrio} value={barrio}>{barrio}</option>
                  ))}
                </select>
                {errors['barrio'] && <p className="mt-1 text-sm text-red-600">{errors['barrio']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Carnet *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipo"
                      value="INDIVIDUAL"
                      checked={formData.tipo === 'INDIVIDUAL'}
                      onChange={(e) => handleTipoChange(e.target.value as 'INDIVIDUAL')}
                      className="mr-2"
                    />
                    <User className="h-4 w-4 mr-1 text-purple-600" />
                    Individual
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipo"
                      value="FAMILIAR"
                      checked={formData.tipo === 'FAMILIAR'}
                      onChange={(e) => handleTipoChange(e.target.value as 'FAMILIAR')}
                      className="mr-2"
                    />
                    <Users className="h-4 w-4 mr-1 text-indigo-600" />
                    Familiar
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Datos del Titular */}
          <div className="border rounded-lg p-4 bg-blue-50 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Titular del Carnet
              <span className="ml-2 text-sm text-blue-600">(Todos los campos obligatorios)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.titular.nombreCompleto}
                  onChange={(e) => updateTitular('nombreCompleto', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['titular-nombre'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Juan García"
                />
                {errors['titular-nombre'] && <p className="mt-1 text-sm text-red-600">{errors['titular-nombre']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono *
                </label>
                <input
                  type="text"
                  value={formData.titular.telefono}
                  onChange={(e) => updateTitular('telefono', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['titular-telefono'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="11-1234-5678"
                />
                {errors['titular-telefono'] && <p className="mt-1 text-sm text-red-600">{errors['titular-telefono']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI *
                </label>
                <input
                  type="text"
                  value={formData.titular.dni}
                  onChange={(e) => updateTitular('dni', e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['titular-dni'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345678"
                  maxLength={8}
                />
                {errors['titular-dni'] && <p className="mt-1 text-sm text-red-600">{errors['titular-dni']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.titular.email}
                  onChange={(e) => updateTitular('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors['titular-email'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan@email.com"
                />
                {errors['titular-email'] && <p className="mt-1 text-sm text-red-600">{errors['titular-email']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vínculo
                </label>
                <select
                  value={formData.titular.vinculo}
                  onChange={(e) => updateTitular('vinculo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="TITULAR">TITULAR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Familiares */}
          {formData.tipo === 'FAMILIAR' && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Familiares ({formData.familiares.length}/4)
                </h3>
                {canAddFamiliar && (
                  <button
                    type="button"
                    onClick={addFamiliar}
                    className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar {getNextCondicion()?.replace('_', ' ')}
                  </button>
                )}
              </div>

              {formData.familiares.map((familiar, index) => (
                <div key={index} className="border rounded-lg p-4 bg-indigo-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {getCondicionLabel(familiar.condicion)}
                      <span className="ml-2 text-sm text-indigo-600">(Nombre y teléfono obligatorios)</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeFamiliar(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        value={familiar.nombreCompleto}
                        onChange={(e) => updateFamiliar(index, 'nombreCompleto', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`familiar-${index}-nombre`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="María García"
                      />
                      {errors[`familiar-${index}-nombre`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`familiar-${index}-nombre`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Teléfono *
                      </label>
                      <input
                        type="text"
                        value={familiar.telefono}
                        onChange={(e) => updateFamiliar(index, 'telefono', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`familiar-${index}-telefono`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="11-8765-4321"
                      />
                      {errors[`familiar-${index}-telefono`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`familiar-${index}-telefono`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DNI (Opcional)
                      </label>
                      <input
                        type="text"
                        value={familiar.dni}
                        onChange={(e) => updateFamiliar(index, 'dni', e.target.value.replace(/\D/g, ''))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`familiar-${index}-dni`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="87654321"
                        maxLength={8}
                      />
                      {errors[`familiar-${index}-dni`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`familiar-${index}-dni`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email (Opcional)
                      </label>
                      <input
                        type="email"
                        value={familiar.email}
                        onChange={(e) => updateFamiliar(index, 'email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`familiar-${index}-email`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="maria@email.com"
                      />
                      {errors[`familiar-${index}-email`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`familiar-${index}-email`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vínculo con Titular
                      </label>
                      <select
                        value={familiar.vinculo}
                        onChange={(e) => updateFamiliar(index, 'vinculo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        {VINCULOS_DISPONIBLES.map(vinculo => (
                          <option key={vinculo} value={vinculo}>{vinculo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón para agregar familiar */}
              {canAddFamiliar && (
                <button
                  type="button"
                  onClick={addFamiliar}
                  className="w-full flex items-center justify-center p-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:border-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar {getNextCondicion()?.replace('_', ' ')}
                </button>
              )}
            </div>
          )}

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Observaciones (Opcional)
            </label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Observaciones adicionales sobre el carnet..."
            />
          </div>

          {/* Errores generales */}
          {errors['dni-duplicated'] && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {errors['dni-duplicated']}
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Crear Carnet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Función auxiliar para labels de condición
const getCondicionLabel = (condicion: string) => {
  switch (condicion) {
    case 'TITULAR': return 'Titular';
    case 'FAMILIAR_1': return 'Familiar 1';
    case 'FAMILIAR_2': return 'Familiar 2';
    case 'FAMILIAR_3': return 'Familiar 3';
    case 'FAMILIAR_ADHERENTE': return 'Adherente';
    default: return condicion;
  }
};

export default CarnetDialog;