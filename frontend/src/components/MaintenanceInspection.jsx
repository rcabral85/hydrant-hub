// HydrantHub Maintenance Inspection Component
// Comprehensive inspection system with audit compliance
// Supports O. Reg 169/03, NFPA 291, and municipal standards

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Modal, Table } from 'react-bootstrap';
import { Camera, CheckCircle, XCircle, AlertTriangle, Tool, FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const MaintenanceInspection = () => {
  const { hydrantId, inspectionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hydrant, setHydrant] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [activeTab, setActiveTab] = useState('visual');
  const [photos, setPhotos] = useState([]);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);

  // Visual Inspection State
  const [visualInspection, setVisualInspection] = useState({
    paint_condition: 'GOOD',
    paint_notes: '',
    body_condition: 'GOOD',
    body_damage_notes: '',
    cap_condition: 'GOOD',
    cap_security: 'SECURE',
    chains_present: true,
    chains_condition: 'GOOD',
    clearance_adequate: true,
    clearance_distance_feet: 3.0,
    obstructions: '',
    visible_from_road: true,
    reflective_markers_present: true,
    signage_adequate: true,
    ground_condition: 'STABLE',
    drainage_adequate: true,
    safety_hazards: '',
    immediate_action_required: false
  });

  // Valve Inspection State
  const [valveInspection, setValveInspection] = useState({
    main_valve_type: 'Gate Valve',
    main_valve_operation: 'SMOOTH',
    main_valve_turns_to_close: null,
    main_valve_turns_to_open: null,
    main_valve_leak_detected: false,
    main_valve_notes: '',
    operating_nut_condition: 'GOOD',
    operating_nut_security: 'TIGHT',
    drain_valve_present: true,
    drain_valve_operation: 'FUNCTIONAL',
    drain_valve_leak: false,
    pumper_connections_count: 2,
    pumper_connections_condition: 'GOOD',
    pumper_caps_present: true,
    pumper_caps_condition: 'GOOD',
    pumper_threads_condition: 'GOOD',
    static_pressure_psi: null,
    static_pressure_location: 'Pumper Connection',
    pressure_gauge_calibrated: true,
    pressure_test_notes: '',
    valve_exercised: false,
    valve_exercise_date: null,
    valve_exercise_successful: null,
    lubrication_applied: false,
    lubrication_type: '',
    performance_issues: '',
    repair_recommendations: '',
    priority_level: 'LOW'
  });

  useEffect(() => {
    fetchData();
  }, [hydrantId, inspectionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hydrant details
      const hydrantResponse = await API.get(`/hydrants/${hydrantId}`);
      setHydrant(hydrantResponse.data.hydrant);

      // Fetch existing inspection if editing
      if (inspectionId) {
        const inspectionResponse = await API.get(`/maintenance/inspections/${inspectionId}`);
        setInspection(inspectionResponse.data.inspection);
      }

      // Fetch inspection checklist template
      const checklistResponse = await API.get('/maintenance/checklist/1'); // Annual inspection
      setChecklist(checklistResponse.data.checklist);

      // Fetch existing work orders
      const workOrderResponse = await API.get(`/maintenance/work-orders/hydrant/${hydrantId}`);
      setWorkOrders(workOrderResponse.data.work_orders);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    setPhotos([...photos, ...files]);
  };

  const submitVisualInspection = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(visualInspection).forEach(key => {
        formData.append(key, visualInspection[key]);
      });
      
      photos.forEach(photo => {
        formData.append('condition_photos', photo);
      });

      await API.post(`/maintenance/inspections/${inspectionId || 'new'}/visual`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Visual inspection saved successfully!');
      
    } catch (error) {
      console.error('Error saving visual inspection:', error);
      alert('Failed to save visual inspection');
    } finally {
      setLoading(false);
    }
  };

  const submitValveInspection = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(valveInspection).forEach(key => {
        if (valveInspection[key] !== null && valveInspection[key] !== '') {
          formData.append(key, valveInspection[key]);
        }
      });
      
      formData.append('hydrant_id', hydrantId);

      await API.post(`/maintenance/inspections/${inspectionId || 'new'}/valve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Valve inspection saved successfully!');
      
    } catch (error) {
      console.error('Error saving valve inspection:', error);
      alert('Failed to save valve inspection');
    } finally {
      setLoading(false);
    }
  };

  const getConditionBadge = (condition) => {
    const badges = {
      'EXCELLENT': 'success',
      'GOOD': 'success', 
      'FAIR': 'warning',
      'POOR': 'danger',
      'CRITICAL': 'danger',
      'MISSING': 'danger'
    };
    return <Badge bg={badges[condition] || 'secondary'}>{condition}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      'LOW': 'secondary',
      'MEDIUM': 'warning',
      'HIGH': 'danger',
      'CRITICAL': 'danger'
    };
    return <Badge bg={badges[priority] || 'secondary'}>{priority}</Badge>;
  };

  if (loading) {
    return <div className="text-center p-4">Loading inspection data...</div>;
  }

  return (
    <div className="maintenance-inspection">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><Tool className="me-2" />Maintenance Inspection</h2>
          {hydrant && (
            <p className="text-muted mb-0">
              Hydrant {hydrant.hydrant_number} - {hydrant.location_address}
            </p>
          )}
        </div>
        <div>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="me-2">
            Back to Hydrant
          </Button>
          <Button variant="primary" onClick={() => setShowWorkOrderModal(true)}>
            View Work Orders ({workOrders.length})
          </Button>
        </div>
      </div>

      {/* Inspection Type Tabs */}
      <Card className="mb-4">
        <Card.Header>
          <nav className="nav nav-tabs card-header-tabs">
            <button 
              className={`nav-link ${activeTab === 'visual' ? 'active' : ''}`}
              onClick={() => setActiveTab('visual')}
            >
              <Camera className="me-1" size={16} />
              Visual Inspection
            </button>
            <button 
              className={`nav-link ${activeTab === 'valve' ? 'active' : ''}`}
              onClick={() => setActiveTab('valve')}
            >
              <Tool className="me-1" size={16} />
              Valve Operation
            </button>
            <button 
              className={`nav-link ${activeTab === 'compliance' ? 'active' : ''}`}
              onClick={() => setActiveTab('compliance')}
            >
              <FileText className="me-1" size={16} />
              Audit Checklist
            </button>
          </nav>
        </Card.Header>

        <Card.Body>
          {/* Visual Inspection Tab */}
          {activeTab === 'visual' && (
            <div className="visual-inspection">
              <h4>Visual Condition Assessment</h4>
              <p className="text-muted">Per Ontario Regulation 169/03, Section 15(1) - Visual Inspection Requirements</p>
              
              <Row>
                <Col md={6}>
                  <h5>Physical Condition</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Paint Condition *</Form.Label>
                    <Form.Select 
                      value={visualInspection.paint_condition}
                      onChange={(e) => setVisualInspection({...visualInspection, paint_condition: e.target.value})}
                    >
                      <option value="EXCELLENT">Excellent - Like New</option>
                      <option value="GOOD">Good - Minor Wear</option>
                      <option value="FAIR">Fair - Noticeable Wear</option>
                      <option value="POOR">Poor - Significant Wear</option>
                      <option value="CRITICAL">Critical - Immediate Attention</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Required for visibility and corrosion protection per O. Reg 169/03
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Paint Condition Notes</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={visualInspection.paint_notes}
                      onChange={(e) => setVisualInspection({...visualInspection, paint_notes: e.target.value})}
                      placeholder="Describe paint condition, rust spots, color fading, etc."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Hydrant Body Condition *</Form.Label>
                    <Form.Select 
                      value={visualInspection.body_condition}
                      onChange={(e) => setVisualInspection({...visualInspection, body_condition: e.target.value})}
                    >
                      <option value="EXCELLENT">Excellent - No Damage</option>
                      <option value="GOOD">Good - Minor Surface Issues</option>
                      <option value="FAIR">Fair - Moderate Damage</option>
                      <option value="POOR">Poor - Significant Damage</option>
                      <option value="CRITICAL">Critical - Structural Damage</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Body Damage Notes</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={visualInspection.body_damage_notes}
                      onChange={(e) => setVisualInspection({...visualInspection, body_damage_notes: e.target.value})}
                      placeholder="Describe any cracks, dents, corrosion, or structural issues"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Cap Condition *</Form.Label>
                    <Form.Select 
                      value={visualInspection.cap_condition}
                      onChange={(e) => setVisualInspection({...visualInspection, cap_condition: e.target.value})}
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                      <option value="MISSING">Missing</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Cap Security</Form.Label>
                    <Form.Select 
                      value={visualInspection.cap_security}
                      onChange={(e) => setVisualInspection({...visualInspection, cap_security: e.target.value})}
                    >
                      <option value="SECURE">Secure</option>
                      <option value="LOOSE">Loose</option>
                      <option value="MISSING">Missing</option>
                      <option value="DAMAGED">Damaged</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <h5>Accessibility & Safety</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Chains Present and Secure"
                      checked={visualInspection.chains_present}
                      onChange={(e) => setVisualInspection({...visualInspection, chains_present: e.target.checked})}
                    />
                    <Form.Text className="text-muted">
                      Required per O. Reg 169/03 - All caps must have security chains
                    </Form.Text>
                  </Form.Group>

                  {visualInspection.chains_present && (
                    <Form.Group className="mb-3">
                      <Form.Label>Chain Condition</Form.Label>
                      <Form.Select 
                        value={visualInspection.chains_condition}
                        onChange={(e) => setVisualInspection({...visualInspection, chains_condition: e.target.value})}
                      >
                        <option value="EXCELLENT">Excellent</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair - Some Rust</option>
                        <option value="POOR">Poor - Heavy Rust/Weak</option>
                        <option value="MISSING">Missing</option>
                      </Form.Select>
                    </Form.Group>
                  )}

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Adequate Clearance (3+ feet from vehicles/obstructions)"
                      checked={visualInspection.clearance_adequate}
                      onChange={(e) => setVisualInspection({...visualInspection, clearance_adequate: e.target.checked})}
                    />
                    <Form.Text className="text-muted">
                      Municipal Standard - Emergency vehicle access requirement
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Clearance Distance (feet)</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="20"
                      value={visualInspection.clearance_distance_feet}
                      onChange={(e) => setVisualInspection({...visualInspection, clearance_distance_feet: parseFloat(e.target.value)})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Obstructions/Issues</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={visualInspection.obstructions}
                      onChange={(e) => setVisualInspection({...visualInspection, obstructions: e.target.value})}
                      placeholder="List any obstructions, parking issues, landscaping problems, etc."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Visible from roadway"
                      checked={visualInspection.visible_from_road}
                      onChange={(e) => setVisualInspection({...visualInspection, visible_from_road: e.target.checked})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Reflective markers present and adequate"
                      checked={visualInspection.reflective_markers_present}
                      onChange={(e) => setVisualInspection({...visualInspection, reflective_markers_present: e.target.checked})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Ground Condition</Form.Label>
                    <Form.Select 
                      value={visualInspection.ground_condition}
                      onChange={(e) => setVisualInspection({...visualInspection, ground_condition: e.target.value})}
                    >
                      <option value="STABLE">Stable</option>
                      <option value="SOFT">Soft</option>
                      <option value="MUDDY">Muddy</option>
                      <option value="ICY">Icy/Hazardous</option>
                      <option value="HAZARDOUS">Hazardous</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Safety Hazards Identified</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3}
                      value={visualInspection.safety_hazards}
                      onChange={(e) => setVisualInspection({...visualInspection, safety_hazards: e.target.value})}
                      placeholder="Document any safety concerns, traffic hazards, public safety issues..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="⚠️ IMMEDIATE ACTION REQUIRED - Critical Safety Issue"
                      checked={visualInspection.immediate_action_required}
                      onChange={(e) => setVisualInspection({...visualInspection, immediate_action_required: e.target.checked})}
                      className="text-danger fw-bold"
                    />
                    <Form.Text className="text-danger">
                      Check this box if the hydrant poses immediate safety risk and requires emergency action
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Upload Condition Photos</Form.Label>
                    <Form.Control 
                      type="file" 
                      multiple 
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handlePhotoUpload}
                    />
                    <Form.Text className="text-muted">
                      Upload photos documenting hydrant condition, issues, or hazards (Max 10 files, 5MB each)
                    </Form.Text>
                    {photos.length > 0 && (
                      <div className="mt-2">
                        <small className="text-success">{photos.length} photos selected for upload</small>
                      </div>
                    )}
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    onClick={submitVisualInspection}
                    disabled={loading}
                    className="me-2"
                  >
                    {loading ? 'Saving...' : 'Save Visual Inspection'}
                  </Button>
                  
                  {visualInspection.immediate_action_required && (
                    <Alert variant="danger" className="mt-3">
                      <AlertTriangle className="me-2" />
                      <strong>Critical Safety Issue Flagged</strong>
                      <br />A work order will be automatically generated for immediate attention.
                    </Alert>
                  )}
                </Col>
              </Row>
            </div>
          )}

          {/* Valve Operation Tab */}
          {activeTab === 'valve' && (
            <div className="valve-inspection">
              <h4>Valve Operation & Static Pressure Testing</h4>
              <p className="text-muted">Per O. Reg 169/03, Section 15(2) - Operational Testing Requirements</p>
              
              <Row>
                <Col md={6}>
                  <h5>Main Valve Operation</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Valve Type</Form.Label>
                    <Form.Select 
                      value={valveInspection.main_valve_type}
                      onChange={(e) => setValveInspection({...valveInspection, main_valve_type: e.target.value})}
                    >
                      <option value="Gate Valve">Gate Valve</option>
                      <option value="Ball Valve">Ball Valve</option>
                      <option value="Butterfly Valve">Butterfly Valve</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Valve Operation *</Form.Label>
                    <Form.Select 
                      value={valveInspection.main_valve_operation}
                      onChange={(e) => setValveInspection({...valveInspection, main_valve_operation: e.target.value})}
                    >
                      <option value="SMOOTH">Smooth - Normal Operation</option>
                      <option value="STIFF">Stiff - Requires Extra Force</option>
                      <option value="BINDING">Binding - Difficult to Operate</option>
                      <option value="INOPERABLE">Inoperable - Cannot Open/Close</option>
                    </Form.Select>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Turns to Close</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="0" 
                          max="50"
                          value={valveInspection.main_valve_turns_to_close || ''}
                          onChange={(e) => setValveInspection({...valveInspection, main_valve_turns_to_close: parseInt(e.target.value)})}
                          placeholder="Count full turns"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Turns to Open</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="0" 
                          max="50"
                          value={valveInspection.main_valve_turns_to_open || ''}
                          onChange={(e) => setValveInspection({...valveInspection, main_valve_turns_to_open: parseInt(e.target.value)})}
                          placeholder="Count full turns"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Water leakage detected during operation"
                      checked={valveInspection.main_valve_leak_detected}
                      onChange={(e) => setValveInspection({...valveInspection, main_valve_leak_detected: e.target.checked})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Operating Nut Condition</Form.Label>
                    <Form.Select 
                      value={valveInspection.operating_nut_condition}
                      onChange={(e) => setValveInspection({...valveInspection, operating_nut_condition: e.target.value})}
                    >
                      <option value="EXCELLENT">Excellent</option>
                      <option value="GOOD">Good</option>
                      <option value="WORN">Worn</option>
                      <option value="DAMAGED">Damaged</option>
                      <option value="MISSING">Missing</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <h5>Static Pressure Test</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Static Pressure (PSI) *</Form.Label>
                    <Form.Control 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="200"
                      value={valveInspection.static_pressure_psi || ''}
                      onChange={(e) => setValveInspection({...valveInspection, static_pressure_psi: parseFloat(e.target.value)})}
                      placeholder="e.g., 72.3"
                    />
                    <Form.Text className="text-muted">
                      Normal range: 40-100+ PSI. Critical measurement for O. Reg 169/03 compliance.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Pressure Test Location</Form.Label>
                    <Form.Select 
                      value={valveInspection.static_pressure_location}
                      onChange={(e) => setValveInspection({...valveInspection, static_pressure_location: e.target.value})}
                    >
                      <option value="Pumper Connection">Pumper Connection</option>
                      <option value="Auxiliary Outlet">Auxiliary Outlet</option>
                      <option value="Main Outlet">Main Outlet</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Pressure gauge calibrated within last 12 months"
                      checked={valveInspection.pressure_gauge_calibrated}
                      onChange={(e) => setValveInspection({...valveInspection, pressure_gauge_calibrated: e.target.checked})}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Pressure Test Notes</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={valveInspection.pressure_test_notes}
                      onChange={(e) => setValveInspection({...valveInspection, pressure_test_notes: e.target.value})}
                      placeholder="Test conditions, gauge type, unusual readings..."
                    />
                  </Form.Group>

                  <h5>Valve Exercise</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Check 
                      type="checkbox"
                      label="Valve exercised during inspection"
                      checked={valveInspection.valve_exercised}
                      onChange={(e) => setValveInspection({...valveInspection, valve_exercised: e.target.checked})}
                    />
                    <Form.Text className="text-muted">
                      AWWA M17 recommendation - Exercise valve annually
                    </Form.Text>
                  </Form.Group>

                  {valveInspection.valve_exercised && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="checkbox"
                          label="Valve exercise successful (full open/close cycle)"
                          checked={valveInspection.valve_exercise_successful}
                          onChange={(e) => setValveInspection({...valveInspection, valve_exercise_successful: e.target.checked})}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check 
                          type="checkbox"
                          label="Lubrication applied"
                          checked={valveInspection.lubrication_applied}
                          onChange={(e) => setValveInspection({...valveInspection, lubrication_applied: e.target.checked})}
                        />
                      </Form.Group>

                      {valveInspection.lubrication_applied && (
                        <Form.Group className="mb-3">
                          <Form.Label>Lubrication Type</Form.Label>
                          <Form.Control 
                            value={valveInspection.lubrication_type}
                            onChange={(e) => setValveInspection({...valveInspection, lubrication_type: e.target.value})}
                            placeholder="e.g., White lithium grease, Marine grease"
                          />
                        </Form.Group>
                      )}
                    </>
                  )}
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Performance Issues</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={valveInspection.performance_issues}
                      onChange={(e) => setValveInspection({...valveInspection, performance_issues: e.target.value})}
                      placeholder="Document any operational problems, unusual sounds, resistance, etc."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Repair Recommendations</Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={2}
                      value={valveInspection.repair_recommendations}
                      onChange={(e) => setValveInspection({...valveInspection, repair_recommendations: e.target.value})}
                      placeholder="Recommended repairs, parts needed, timeline for action..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Priority Level</Form.Label>
                    <Form.Select 
                      value={valveInspection.priority_level}
                      onChange={(e) => setValveInspection({...valveInspection, priority_level: e.target.value})}
                    >
                      <option value="LOW">Low - Routine Maintenance</option>
                      <option value="MEDIUM">Medium - Schedule within 3 months</option>
                      <option value="HIGH">High - Schedule within 1 month</option>
                      <option value="CRITICAL">Critical - Immediate Attention Required</option>
                    </Form.Select>
                  </Form.Group>

                  <Button 
                    variant="primary" 
                    onClick={submitValveInspection}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Valve Inspection'}
                  </Button>
                  
                  {(['BINDING', 'INOPERABLE'].includes(valveInspection.main_valve_operation) || 
                    valveInspection.priority_level === 'CRITICAL') && (
                    <Alert variant="warning" className="mt-3">
                      <AlertTriangle className="me-2" />
                      <strong>Maintenance Required</strong>
                      <br />A work order will be automatically generated based on these findings.
                    </Alert>
                  )}
                </Col>
              </Row>
            </div>
          )}

          {/* Audit Checklist Tab */}
          {activeTab === 'compliance' && (
            <div className="compliance-checklist">
              <h4>Regulatory Compliance Checklist</h4>
              <p className="text-muted">Ontario Regulation 169/03 & Municipal Standards Verification</p>
              
              {Object.keys(checklist).map(category => (
                <Card key={category} className="mb-3">
                  <Card.Header>
                    <h5 className="mb-0">{category.replace('_', ' ')} Requirements</h5>
                  </Card.Header>
                  <Card.Body>
                    {checklist[category].map(item => (
                      <div key={item.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                        <div className="flex-grow-1">
                          <strong>{item.item_description}</strong>
                          {item.regulatory_reference && (
                            <div className="small text-muted">
                              Reference: {item.regulatory_reference}
                            </div>
                          )}
                        </div>
                        <div className="ms-3">
                          <Form.Select size="sm" style={{minWidth: '120px'}}>
                            <option value="PASS">✓ PASS</option>
                            <option value="FAIL">✗ FAIL</option>
                            <option value="N/A">N/A</option>
                            <option value="CONDITIONAL">Conditional</option>
                          </Form.Select>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              ))}
              
              <Button variant="success" className="me-2">
                Complete Compliance Checklist
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Work Orders Modal */}
      <Modal show={showWorkOrderModal} onHide={() => setShowWorkOrderModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Work Orders - {hydrant?.hydrant_number}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {workOrders.length > 0 ? (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>WO #</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.id}>
                    <td><code>{wo.work_order_number}</code></td>
                    <td>{wo.title}</td>
                    <td>{getPriorityBadge(wo.priority)}</td>
                    <td><Badge bg="info">{wo.status}</Badge></td>
                    <td>{new Date(wo.target_completion_date).toLocaleDateString()}</td>
                    <td>
                      <Button size="sm" variant="outline-primary">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">No active work orders for this hydrant.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkOrderModal(false)}>
            Close
          </Button>
          <Button variant="primary">
            Create New Work Order
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MaintenanceInspection;