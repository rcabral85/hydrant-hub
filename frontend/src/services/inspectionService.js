// frontend/src/services/inspectionService.js
import api from './api';

/**
 * Inspection Service
 * Handles all API calls for maintenance inspections, work orders, and compliance
 */

// ==================== INSPECTIONS ====================

/**
 * Get all inspections for a specific hydrant
 * @param {string} hydrantId - Hydrant UUID
 * @param {object} filters - { type, limit, offset }
 */
export const getInspectionsByHydrant = async (hydrantId, filters = {}) => {
  try {
    const { type = 'all', limit = 10, offset = 0 } = filters;
    const response = await api.get(`/maintenance/inspections/hydrant/${hydrantId}`, {
      params: { type, limit, offset }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to fetch inspections';
    return { success: false, error: message };
  }
};

/**
 * Create a new maintenance inspection
 * @param {object} inspectionData - Inspection details
 * @param {File[]} photos - Array of photo files
 */
export const createInspection = async (inspectionData, photos = []) => {
  try {
    const formData = new FormData();
    
    // Append inspection data
    Object.keys(inspectionData).forEach(key => {
      if (inspectionData[key] !== undefined && inspectionData[key] !== null) {
        formData.append(key, inspectionData[key]);
      }
    });
    
    // Append photos
    photos.forEach(photo => {
      formData.append('photos', photo);
    });
    
    const response = await api.post('/maintenance/inspections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to create inspection';
    return { success: false, error: message };
  }
};

/**
 * Create or update visual inspection details
 * @param {string} inspectionId - Inspection UUID
 * @param {object} visualData - Visual inspection details
 * @param {File[]} photos - Condition photos
 */
export const createVisualInspection = async (inspectionId, visualData, photos = []) => {
  try {
    const formData = new FormData();
    
    // Append visual inspection data
    Object.keys(visualData).forEach(key => {
      if (visualData[key] !== undefined && visualData[key] !== null) {
        formData.append(key, visualData[key]);
      }
    });
    
    // Append condition photos
    photos.forEach(photo => {
      formData.append('condition_photos', photo);
    });
    
    const response = await api.post(
      `/maintenance/inspections/${inspectionId}/visual`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to save visual inspection';
    return { success: false, error: message };
  }
};

/**
 * Create or update valve inspection details
 * @param {string} inspectionId - Inspection UUID
 * @param {object} valveData - Valve inspection details
 * @param {File[]} photos - Valve photos
 */
export const createValveInspection = async (inspectionId, valveData, photos = []) => {
  try {
    const formData = new FormData();
    
    // Append valve inspection data
    Object.keys(valveData).forEach(key => {
      if (valveData[key] !== undefined && valveData[key] !== null) {
        formData.append(key, valveData[key]);
      }
    });
    
    // Append valve photos
    photos.forEach(photo => {
      formData.append('valve_photos', photo);
    });
    
    const response = await api.post(
      `/maintenance/inspections/${inspectionId}/valve`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to save valve inspection';
    return { success: false, error: message };
  }
};

// ==================== WORK ORDERS ====================

/**
 * Get work orders for a specific hydrant
 * @param {string} hydrantId - Hydrant UUID
 * @param {object} filters - { status, priority, limit, offset }
 */
export const getWorkOrders = async (hydrantId, filters = {}) => {
  try {
    const { status = 'all', priority = 'all', limit = 20, offset = 0 } = filters;
    const response = await api.get(`/maintenance/work-orders/hydrant/${hydrantId}`, {
      params: { status, priority, limit, offset }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to fetch work orders';
    return { success: false, error: message };
  }
};

/**
 * Update work order status and details
 * @param {string} workOrderId - Work Order UUID
 * @param {object} updates - Updated fields
 * @param {File[]} photos - Completion photos
 */
export const updateWorkOrder = async (workOrderId, updates, photos = []) => {
  try {
    const formData = new FormData();
    
    // Append updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && updates[key] !== null) {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          formData.append(key, JSON.stringify(updates[key]));
        } else {
          formData.append(key, updates[key]);
        }
      }
    });
    
    // Append completion photos
    photos.forEach(photo => {
      formData.append('completion_photos', photo);
    });
    
    const response = await api.patch(`/maintenance/work-orders/${workOrderId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to update work order';
    return { success: false, error: message };
  }
};

// ==================== COMPLIANCE ====================

/**
 * Get compliance schedule
 * @param {object} filters - { start_date, end_date, status, hydrant_id }
 */
export const getComplianceSchedule = async (filters = {}) => {
  try {
    const response = await api.get('/maintenance/compliance/schedule', {
      params: filters
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to fetch compliance schedule';
    return { success: false, error: message };
  }
};

/**
 * Generate compliance report (PDF or JSON)
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} format - 'json' or 'pdf'
 */
export const generateComplianceReport = async (startDate, endDate, format = 'json') => {
  try {
    const response = await api.get('/maintenance/compliance/report', {
      params: { start_date: startDate, end_date: endDate, format }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to generate compliance report';
    return { success: false, error: message };
  }
};

/**
 * Get inspection checklist template
 * @param {number} inspectionTypeId - Inspection type ID
 */
export const getInspectionChecklist = async (inspectionTypeId) => {
  try {
    const response = await api.get(`/maintenance/checklist/${inspectionTypeId}`);
    return { success: true, data: response.data };
  } catch (error) {
    const message = error.response?.data?.error || 'Failed to fetch inspection checklist';
    return { success: false, error: message };
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert file to base64 for preview
 * @param {File} file 
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validate file type and size
 * @param {File} file 
 * @param {number} maxSizeMB - Maximum size in MB (default 5)
 */
export const validateFile = (file, maxSizeMB = 5) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and PDF files are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  
  return { valid: true };
};

export default {
  getInspectionsByHydrant,
  createInspection,
  createVisualInspection,
  createValveInspection,
  getWorkOrders,
  updateWorkOrder,
  getComplianceSchedule,
  generateComplianceReport,
  getInspectionChecklist,
  fileToBase64,
  validateFile
};
