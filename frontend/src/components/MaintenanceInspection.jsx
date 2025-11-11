// Updated HydrantHub Maintenance Inspection Component
// Progressive workflow: 4 steps matching field inspection process

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Camera, Save, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const MaintenanceInspection = () => {
  const { hydrantId, inspectionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hydrant, setHydrant] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [inspectionData, setInspectionData] = useState({
    inspector_name: '',
    inspection_date: new Date().toISOString().split('T')[0],
    weather_conditions: '',
    temperature_celsius: '',
    paint_condition: '',
    body_condition: '',
    cap_condition: '',
    cap_security: '',
    chains_present: null,
    chains_condition: '',
    clearance_adequate: null,
    obstructions: '',
    immediate_safety_concern: false,
    valve_operation: '',
    valve_turns: '',
    static_pressure_psi: '',
    valve_leak: false,
    valve_exercised: false,
    overall_condition: '',
    repair_needed: false,
    priority_level: 'LOW',
    inspector_notes: ''
  });

  useEffect(() => {
    fetchHydrant();
    getCurrentLocation();
  }, [hydrantId]);

  const fetchHydrant = async () => {
    setLoading(true);
    try {
      const response = await API.get(`/hydrants/${hydrantId}`);
      setHydrant(response.data.hydrant);
    } catch (error) {
      console.error('Error fetching hydrant:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => console.log('GPS error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    setPhotos([...photos, ...files]);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitInspection = async () => {
  try {
    setLoading(true);
    
    const formData = new FormData();
    Object.keys(inspectionData).forEach(key => {
      formData.append(key, inspectionData[key]);
    });
    
    if (gpsLocation) {
      formData.append('inspector_gps_lat', gpsLocation.lat);
      formData.append('inspector_gps_lng', gpsLocation.lng);
      formData.append('gps_accuracy', gpsLocation.accuracy);
    }
    
    photos.forEach(photo => {
      formData.append('inspection_photos', photo);
    });
    
    formData.append('hydrant_id', hydrantId);
    
    // Actually wait for the response and check if it succeeded
    const response = await API.post('/maintenance/inspections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Only show success if we got a 200/201 response
    if (response.status === 200 || response.status === 201) {
      alert('Inspection submitted successfully!');
      setCurrentStep(1);
      setPhotos([]);
      // Navigate back to the map or hydrant detail page
      navigate(`/map`);
    }
  } catch (error) {
    console.error('Error submitting inspection:', error);
    // Show the actual error from the server
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to submit inspection.';
    alert(`ERROR: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
};


      alert('Inspection submitted successfully!');
      setCurrentStep(1);
      setPhotos([]);
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to submit inspection.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setInspectionData(prev => ({ ...prev, [field]: value }));
  };

  // Progressive Workflow UI
  return (
    <div className="maintenance-inspection" style={{ maxWidth: '900px', margin: 'auto', padding: '10px' }}>
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Maintenance Inspection Workflow</h4>
              {hydrant && (
                <>
                  <Badge bg="primary">{hydrant.hydrant_number}</Badge>
                  <p className="text-muted mb-0 mt-1" style={{ fontSize: '0.9em' }}>
                    <MapPin size={14} className="me-1" />
                    {hydrant.location_address}
                  </p>
                </>
              )}
            </div>
            <div className="text-end">
              <div className="text-muted" style={{ fontSize: '0.8em' }}>Step {currentStep} of 4</div>
              <div className="progress mt-1" style={{ height: '6px', width: '80px' }}>
                <div className="progress-bar bg-success" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Workflow Steps */}
      {currentStep === 1 && (
        <Card>
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Step 1: Pre-Inspection Setup</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Inspector Name</Form.Label>
              <Form.Control 
                value={inspectionData.inspector_name}
                onChange={(e) => updateField('inspector_name', e.target.value)}
                placeholder="Enter inspector name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Inspection Date</Form.Label>
              <Form.Control 
                type="date"
                value={inspectionData.inspection_date}
                onChange={(e) => updateField('inspection_date', e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Weather Conditions</Form.Label>
              <Form.Select 
                value={inspectionData.weather_conditions}
                onChange={(e) => updateField('weather_conditions', e.target.value)}
              >
                <option value="">Select weather...</option>
                <option value="Clear, sunny">Clear, sunny</option>
                <option value="Overcast">Overcast</option>
                <option value="Light rain">Light rain</option>
                <option value="Heavy rain">Heavy rain</option>
                <option value="Snow">Snow</option>
                <option value="Windy">Windy</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Temperature (°C)</Form.Label>
              <Form.Control 
                type="number"
                value={inspectionData.temperature_celsius}
                onChange={(e) => updateField('temperature_celsius', e.target.value)}
                placeholder="e.g., 18" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload Photos</Form.Label>
              <Form.Control 
                type="file" multiple accept="image/jpeg,image/png" onChange={handlePhotoUpload} />
              <Form.Text>{photos.length} files selected</Form.Text>
            </Form.Group>
            {/* GPS display */}
            {gpsLocation && (
              <Alert variant="success" className="py-2 mb-3">
                <MapPin size={16} className="me-1" />
                GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)} 
                <small>(±{Math.round(gpsLocation.accuracy)}m)</small>
              </Alert>
            )}
          </Card.Body>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Step 2: Visual Assessment</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Paint Condition</Form.Label>
              <Form.Select 
                value={inspectionData.paint_condition}
                onChange={(e) => updateField('paint_condition', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Body Condition</Form.Label>
              <Form.Select 
                value={inspectionData.body_condition}
                onChange={(e) => updateField('body_condition', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cap Condition</Form.Label>
              <Form.Select 
                value={inspectionData.cap_condition}
                onChange={(e) => updateField('cap_condition', e.target.value)}
              >
                <option value="">Select...</option>
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
                value={inspectionData.cap_security}
                onChange={(e) => updateField('cap_security', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="SECURE">Secure</option>
                <option value="LOOSE">Loose</option>
                <option value="MISSING">Missing</option>
                <option value="DAMAGED">Damaged</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Chains Present" checked={inspectionData.chains_present || false}
                  onChange={(e) => updateField('chains_present', e.target.checked)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chains Condition</Form.Label>
              <Form.Select
                value={inspectionData.chains_condition}
                onChange={(e) => updateField('chains_condition', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="MISSING">Missing</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Adequate Clearance"
                checked={inspectionData.clearance_adequate || false}
                onChange={(e) => updateField('clearance_adequate', e.target.checked)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Obstructions/Issues</Form.Label>
              <Form.Control as="textarea" rows={2} value={inspectionData.obstructions}
                onChange={(e) => updateField('obstructions', e.target.value)}
                placeholder="Describe any access issues or hazards" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="IMMEDIATE SAFETY CONCERN"
                checked={inspectionData.immediate_safety_concern || false}
                onChange={(e) => updateField('immediate_safety_concern', e.target.checked)} className="text-danger fw-bold" />
            </Form.Group>
          </Card.Body>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Step 3: Valve Operation Test</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Valve Operation</Form.Label>
              <Form.Select 
                value={inspectionData.valve_operation}
                onChange={(e) => updateField('valve_operation', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="SMOOTH">Smooth</option>
                <option value="STIFF">Stiff</option>
                <option value="BINDING">Binding</option>
                <option value="INOPERABLE">Inoperable</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Valve Turns to Close</Form.Label>
              <Form.Control type="number"
                value={inspectionData.valve_turns}
                onChange={(e) => updateField('valve_turns', e.target.value)}
                placeholder="Count full turns" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Static Pressure (PSI)</Form.Label>
              <Form.Control type="number" step="0.1"
                value={inspectionData.static_pressure_psi}
                onChange={(e) => updateField('static_pressure_psi', e.target.value)}
                placeholder="e.g., 72.5" />
              <Form.Text>Attach pressure gauge to pumper connection</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Water Leak Detected"
                checked={inspectionData.valve_leak || false}
                onChange={(e) => updateField('valve_leak', e.target.checked)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Valve Exercised (Full Open/Close)"
                checked={inspectionData.valve_exercised || false}
                onChange={(e) => updateField('valve_exercised', e.target.checked)} />
            </Form.Group>
          </Card.Body>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Step 4: Final Assessment & Submission</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Overall Condition</Form.Label>
              <Form.Select 
                value={inspectionData.overall_condition}
                onChange={(e) => updateField('overall_condition', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Repairs Needed"
                checked={inspectionData.repair_needed || false}
                onChange={(e) => updateField('repair_needed', e.target.checked)} />
            </Form.Group>
            {inspectionData.repair_needed && (
              <Form.Group className="mb-3">
                <Form.Label>Priority Level</Form.Label>
                <Form.Select 
                  value={inspectionData.priority_level}
                  onChange={(e) => updateField('priority_level', e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Inspector Notes</Form.Label>
              <Form.Control as="textarea" rows={4} value={inspectionData.inspector_notes}
                onChange={(e) => updateField('inspector_notes', e.target.value)}
                placeholder="Additional observations, recommendations, or concerns..." />
            </Form.Group>
            {/* Inspection Summary */}
            <Card className="bg-light mb-3">
              <Card.Body>
                <h6 className="fw-bold mb-2">Inspection Summary</h6>
                <div className="small">
                  <strong>Paint:</strong> {inspectionData.paint_condition || 'Not assessed'}<br />
                  <strong>Body:</strong> {inspectionData.body_condition || 'Not assessed'}<br />
                  <strong>Valve:</strong> {inspectionData.valve_operation || 'Not tested'}<br />
                  <strong>Pressure:</strong> {inspectionData.static_pressure_psi ? `${inspectionData.static_pressure_psi} PSI` : 'Not measured'}<br />
                  <strong>Overall:</strong> {inspectionData.overall_condition || 'Not determined'}<br />
                  <strong>Photos:</strong> {photos.length} captured<br />
                  {gpsLocation && <><strong>GPS:</strong> Verified ✓<br /></>}
                </div>
              </Card.Body>
            </Card>
            <Button variant="success" onClick={submitInspection} disabled={loading} className="me-2">
              <Save className="me-2" size={16} />{loading ? 'Saving...' : 'Submit Inspection'}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-between mt-3" style={{ gap: '10px' }}>
        <Button variant="outline-secondary" onClick={prevStep}
          disabled={currentStep === 1}>Previous</Button>
        {currentStep < 4 && (
          <Button variant="primary" onClick={nextStep}>Next Step</Button>
        )}
      </div>

      {/* Critical Safety Alert */}
      {(inspectionData.immediate_safety_concern || inspectionData.valve_operation === 'INOPERABLE' || inspectionData.priority_level === 'CRITICAL') && (
        <Alert variant="danger" className="mt-3">
          <AlertTriangle className="me-2" size={20} />
          <strong>CRITICAL SAFETY ISSUE IDENTIFIED</strong>
          <br />
          This inspection will generate an immediate work order and notify emergency services.
        </Alert>
      )}

      {/* Offline Indicator */}
      <div className="text-center mt-3">
        <small className="text-muted">
          <span className="badge bg-success me-2">Online</span> Data will sync automatically
        </small>
      </div>
    </div>
  );
};

export default MaintenanceInspection;
