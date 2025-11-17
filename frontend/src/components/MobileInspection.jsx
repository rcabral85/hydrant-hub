// HydrantHub Mobile Inspection Component
// Optimized for field use with large touch targets and offline capability
// Designed for water operators wearing gloves in outdoor conditions

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Badge } from 'react-bootstrap';
import { Camera, Save, AlertTriangle, CheckCircle, MapPin, Thermometer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

const MobileInspection = () => {
  const { hydrantId } = useParams();
  const [hydrant, setHydrant] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [inspectionData, setInspectionData] = useState({
    inspector_name: 'Rich Cabral',
    inspector_license: 'WDO-ON-2019-1234',
    inspection_date: new Date().toISOString().split('T')[0],
    weather_conditions: '',
    temperature_celsius: '',
    
    // Visual Assessment (Step 1)
    paint_condition: '',
    body_condition: '',
    cap_condition: '',
    cap_security: '',
    chains_present: null,
    chains_condition: '',
    clearance_adequate: null,
    immediate_safety_concern: false,
    
    // Valve Operation (Step 2)
    valve_operation: '',
    valve_turns: '',
    static_pressure_psi: '',
    valve_leak: false,
    valve_exercised: false,
    
    // Final Notes (Step 3)
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
    try {
      const response = await API.get(`/hydrants/${hydrantId}`);
      setHydrant(response.data.hydrant);
    } catch (error) {
      console.error('Error fetching hydrant:', error);
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

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Simple photo capture implementation
      // In production, would use proper camera component
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.capture = 'camera';
      fileInput.click();
      
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          setPhotos([...photos, file]);
        }
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      // Fallback to file input if camera not available
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.click();
      
      fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos([...photos, ...files]);
      };
    }
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
  setLoading(true);
  
  try {
    const formData = new FormData();
    
    // Add all inspection data
    Object.keys(inspectionData).forEach(key => {
      if (inspectionData[key] !== null && inspectionData[key] !== '') {
        formData.append(key, inspectionData[key]);
      }
    });
    
    // Add GPS data
    if (gpsLocation) {
      formData.append('inspector_gps_lat', gpsLocation.lat);
      formData.append('inspector_gps_lng', gpsLocation.lng);
    }
    
    // Add photos
    photos.forEach(photo => {
      formData.append('inspection_photos', photo);
    });
    
    formData.append('hydrant_id', hydrantId);
    formData.append('inspection_type_id', 1);
    
    console.log('Submitting inspection...', Object.fromEntries(formData));
    
    // ACTUALLY CALL THE API
    const response = await API.post('/maintenance/inspections', formData, {

      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    if (response.status === 200 || response.status === 201) {
      alert('Inspection submitted successfully!');
      navigate('/maintenance');
    }
    
  } catch (error) {
    console.error('Error submitting inspection:', error);
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         'Failed to submit inspection. Please try again.';
    alert(`ERROR: ${errorMessage}`);
  } finally {
    setLoading(false);
    setShowSummary(false);
  }
};


  const updateField = (field, value) => {
    setInspectionData(prev => ({ ...prev, [field]: value }));
  };

  const getStepProgress = () => {
    return (currentStep / 4) * 100;
  };

  return (
    <div className="mobile-inspection" style={{ maxWidth: '100%', padding: '10px' }}>
      {/* Header */}
      <Card className="mb-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">Field Inspection</h4>
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
                <div 
                  className="progress-bar bg-success" 
                  style={{ width: `${getStepProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* GPS Status */}
      {gpsLocation && (
        <Alert variant="success" className="py-2 mb-3">
          <MapPin size={16} className="me-1" />
          GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)} 
          <small>(±{Math.round(gpsLocation.accuracy)}m)</small>
        </Alert>
      )}

      {/* Step 1: Basic Info & Weather */}
      {currentStep === 1 && (
        <Card>
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Step 1: Basic Information</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Weather Conditions</Form.Label>
              <Form.Select 
                value={inspectionData.weather_conditions}
                onChange={(e) => updateField('weather_conditions', e.target.value)}
                style={{ fontSize: '1.1em', padding: '12px' }}
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
              <Form.Label className="fw-bold">Temperature (°C)</Form.Label>
              <Form.Control 
                type="number"
                value={inspectionData.temperature_celsius}
                onChange={(e) => updateField('temperature_celsius', e.target.value)}
                placeholder="e.g., 18"
                style={{ fontSize: '1.1em', padding: '12px' }}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="primary" 
                onClick={capturePhoto}
                className="flex-fill"
                style={{ padding: '15px', fontSize: '1.1em' }}
              >
                <Camera className="me-2" />Take Photo
              </Button>
              <Badge 
                bg="info" 
                className="d-flex align-items-center px-3"
                style={{ fontSize: '1em' }}
              >
                {photos.length} photos
              </Badge>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 2: Visual Assessment */}
      {currentStep === 2 && (
        <Card>
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Step 2: Visual Condition</h5>
          </Card.Header>
          <Card.Body>
            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Paint Condition</Form.Label>
              <div className="d-grid gap-2">
                {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].map(condition => (
                  <Button 
                    key={condition}
                    variant={inspectionData.paint_condition === condition ? 'success' : 'outline-secondary'}
                    onClick={() => updateField('paint_condition', condition)}
                    style={{ padding: '15px', fontSize: '1.1em', textAlign: 'left' }}
                  >
                    <CheckCircle className="me-2" size={16} />
                    {condition}
                    <small className="d-block text-muted mt-1">
                      {{
                        'EXCELLENT': 'Like new, no fading or rust',
                        'GOOD': 'Minor wear, good visibility', 
                        'FAIR': 'Noticeable fading, some rust spots',
                        'POOR': 'Significant wear, visibility affected',
                        'CRITICAL': 'Severe condition, immediate attention needed'
                      }[condition]}
                    </small>
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Body Condition</Form.Label>
              <div className="d-grid gap-2">
                {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'].map(condition => (
                  <Button 
                    key={condition}
                    variant={inspectionData.body_condition === condition ? 'success' : 'outline-secondary'}
                    onClick={() => updateField('body_condition', condition)}
                    style={{ padding: '15px', fontSize: '1.1em', textAlign: 'left' }}
                  >
                    <CheckCircle className="me-2" size={16} />
                    {condition}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Cap & Chain Status</Form.Label>
              <div className="row g-2">
                <div className="col-6">
                  <Form.Select 
                    value={inspectionData.cap_condition}
                    onChange={(e) => updateField('cap_condition', e.target.value)}
                    style={{ fontSize: '1.1em', padding: '12px' }}
                  >
                    <option value="">Cap condition...</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                    <option value="MISSING">Missing</option>
                  </Form.Select>
                </div>
                <div className="col-6">
                  <div className="d-grid">
                    <Button 
                      variant={inspectionData.chains_present ? 'success' : 'danger'}
                      onClick={() => updateField('chains_present', !inspectionData.chains_present)}
                      style={{ padding: '12px', fontSize: '1.1em' }}
                    >
                      {inspectionData.chains_present ? '✓ Chains OK' : '✗ Chains Missing'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Safety Check</Form.Label>
              <div className="d-grid gap-2">
                <Button 
                  variant={inspectionData.clearance_adequate ? 'success' : 'danger'}
                  onClick={() => updateField('clearance_adequate', !inspectionData.clearance_adequate)}
                  style={{ padding: '15px', fontSize: '1.1em' }}
                >
                  {inspectionData.clearance_adequate ? 
                    <><CheckCircle className="me-2" size={16} />3+ Feet Clear Access</> :
                    <><AlertTriangle className="me-2" size={16} />Clearance Issue</>}
                </Button>
                
                <Button 
                  variant={inspectionData.immediate_safety_concern ? 'danger' : 'success'}
                  onClick={() => updateField('immediate_safety_concern', !inspectionData.immediate_safety_concern)}
                  style={{ padding: '15px', fontSize: '1.1em' }}
                >
                  {inspectionData.immediate_safety_concern ? 
                    <><AlertTriangle className="me-2" size={16} />SAFETY HAZARD IDENTIFIED</> :
                    <><CheckCircle className="me-2" size={16} />No Safety Concerns</>}
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 3: Valve Operation */}
      {currentStep === 3 && (
        <Card>
          <Card.Header className="bg-info text-white">
            <h5 className="mb-0">Step 3: Valve Operation</h5>
          </Card.Header>
          <Card.Body>
            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Valve Operation Test</Form.Label>
              <div className="d-grid gap-2">
                {[
                  { value: 'SMOOTH', label: 'Smooth Operation', desc: 'Normal force required' },
                  { value: 'STIFF', label: 'Stiff Operation', desc: 'Extra force needed' },
                  { value: 'BINDING', label: 'Binding', desc: 'Very difficult to turn' },
                  { value: 'INOPERABLE', label: 'Inoperable', desc: 'Cannot open/close' }
                ].map(option => (
                  <Button 
                    key={option.value}
                    variant={inspectionData.valve_operation === option.value ? 'success' : 'outline-secondary'}
                    onClick={() => updateField('valve_operation', option.value)}
                    style={{ padding: '15px', fontSize: '1.1em', textAlign: 'left' }}
                  >
                    <div>
                      <strong>{option.label}</strong>
                      <br />
                      <small className="text-muted">{option.desc}</small>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <Form.Label className="fw-bold">Valve Turns to Close</Form.Label>
              <Form.Control 
                type="number"
                value={inspectionData.valve_turns}
                onChange={(e) => updateField('valve_turns', e.target.value)}
                placeholder="Count full turns"
                style={{ fontSize: '1.1em', padding: '12px' }}
              />
            </div>

            <div className="mb-4">
              <Form.Label className="fw-bold">Static Pressure (PSI)</Form.Label>
              <Form.Control 
                type="number"
                step="0.1"
                value={inspectionData.static_pressure_psi}
                onChange={(e) => updateField('static_pressure_psi', e.target.value)}
                placeholder="e.g., 72.5"
                style={{ fontSize: '1.1em', padding: '12px' }}
              />
              <Form.Text>Attach pressure gauge to pumper connection</Form.Text>
            </div>

            <div className="mb-4">
              <div className="d-grid gap-2">
                <Button 
                  variant={inspectionData.valve_leak ? 'danger' : 'success'}
                  onClick={() => updateField('valve_leak', !inspectionData.valve_leak)}
                  style={{ padding: '15px', fontSize: '1.1em' }}
                >
                  {inspectionData.valve_leak ? 
                    <><AlertTriangle className="me-2" size={16} />Water Leak Detected</> :
                    <><CheckCircle className="me-2" size={16} />No Leaks Detected</>}
                </Button>
                
                <Button 
                  variant={inspectionData.valve_exercised ? 'success' : 'outline-secondary'}
                  onClick={() => updateField('valve_exercised', !inspectionData.valve_exercised)}
                  style={{ padding: '15px', fontSize: '1.1em' }}
                >
                  {inspectionData.valve_exercised ? 
                    <><CheckCircle className="me-2" size={16} />Valve Exercised (Full Open/Close)</> :
                    <><AlertTriangle className="me-2" size={16} />Valve Not Exercised</>}
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Step 4: Final Assessment */}
      {currentStep === 4 && (
        <Card>
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Step 4: Final Assessment</h5>
          </Card.Header>
          <Card.Body>
            <div className="mb-4">
              <Form.Label className="fw-bold mb-3">Overall Condition</Form.Label>
              <div className="d-grid gap-2">
                {[
                  { value: 'EXCELLENT', label: 'Excellent', color: 'success' },
                  { value: 'GOOD', label: 'Good', color: 'success' },
                  { value: 'FAIR', label: 'Fair', color: 'warning' },
                  { value: 'POOR', label: 'Poor', color: 'danger' },
                  { value: 'CRITICAL', label: 'Critical', color: 'danger' }
                ].map(option => (
                  <Button 
                    key={option.value}
                    variant={inspectionData.overall_condition === option.value ? option.color : 'outline-secondary'}
                    onClick={() => updateField('overall_condition', option.value)}
                    style={{ padding: '15px', fontSize: '1.1em' }}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <div className="d-grid gap-2">
                <Button 
                  variant={inspectionData.repair_needed ? 'warning' : 'outline-secondary'}
                  onClick={() => updateField('repair_needed', !inspectionData.repair_needed)}
                  style={{ padding: '15px', fontSize: '1.1em' }}
                >
                  {inspectionData.repair_needed ? 
                    <><AlertTriangle className="me-2" size={16} />Repair/Maintenance Needed</> :
                    <><CheckCircle className="me-2" size={16} />No Repairs Needed</>}
                </Button>
              </div>
            </div>

            {inspectionData.repair_needed && (
              <div className="mb-4">
                <Form.Label className="fw-bold">Priority Level</Form.Label>
                <div className="d-grid gap-2">
                  {[
                    { value: 'LOW', label: 'Low Priority', desc: 'Schedule within 6 months' },
                    { value: 'MEDIUM', label: 'Medium Priority', desc: 'Schedule within 3 months' },
                    { value: 'HIGH', label: 'High Priority', desc: 'Schedule within 1 month' },
                    { value: 'CRITICAL', label: 'CRITICAL', desc: 'Immediate action required' }
                  ].map(option => (
                    <Button 
                      key={option.value}
                      variant={inspectionData.priority_level === option.value ? 
                        (option.value === 'CRITICAL' ? 'danger' : 'warning') : 'outline-secondary'}
                      onClick={() => updateField('priority_level', option.value)}
                      style={{ padding: '15px', fontSize: '1.1em', textAlign: 'left' }}
                    >
                      <div>
                        <strong>{option.label}</strong>
                        <br />
                        <small>{option.desc}</small>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <Form.Label className="fw-bold">Inspector Notes</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                value={inspectionData.inspector_notes}
                onChange={(e) => updateField('inspector_notes', e.target.value)}
                placeholder="Additional observations, recommendations, or concerns..."
                style={{ fontSize: '1.1em', padding: '12px' }}
              />
            </div>
            
            <div className="mb-3">
              <Button 
                variant="primary" 
                onClick={capturePhoto}
                className="w-100"
                style={{ padding: '15px', fontSize: '1.1em' }}
              >
                <Camera className="me-2" />Take Final Photos ({photos.length} total)
              </Button>
            </div>
            
            {/* Inspection Summary */}
            <Card className="bg-light">
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
          </Card.Body>
        </Card>
      )}

      {/* Navigation */}
      <div className="d-flex justify-content-between mt-3" style={{ gap: '10px' }}>
        <Button 
          variant="outline-secondary" 
          onClick={prevStep}
          disabled={currentStep === 1}
          style={{ padding: '12px 20px', fontSize: '1.1em', flex: '1' }}
        >
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button 
            variant="primary" 
            onClick={nextStep}
            style={{ padding: '12px 20px', fontSize: '1.1em', flex: '2' }}
          >
            Next Step
          </Button>
        ) : (
          <Button 
            variant="success" 
            onClick={submitInspection}
            style={{ padding: '12px 20px', fontSize: '1.1em', flex: '2' }}
          >
            <Save className="me-2" size={16} />
            Submit Inspection
          </Button>
        )}
      </div>

      {/* Critical Safety Alert */}
      {(inspectionData.immediate_safety_concern || 
        inspectionData.valve_operation === 'INOPERABLE' ||
        inspectionData.priority_level === 'CRITICAL') && (
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
          <span className="badge bg-success me-2">Online</span>
          Data will sync automatically
        </small>
      </div>
    </div>
  );
};

export default MobileInspection;

// Companion styles for mobile optimization
// Add to your CSS file:
/*
.mobile-inspection {
  font-size: 16px !important; /* Prevent zoom on iOS */
  -webkit-user-select: none;
  user-select: none;
}

.mobile-inspection .btn {
  min-height: 44px; /* iOS touch target minimum */
  border-radius: 8px;
}

.mobile-inspection .form-control,
.mobile-inspection .form-select {
  min-height: 44px;
  font-size: 16px !important;
  border-radius: 8px;
}

.mobile-inspection .form-label {
  font-size: 1.1em;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .mobile-inspection {
    padding: 5px !important;
  }
  
  .mobile-inspection .card {
    margin-bottom: 10px;
  }
  
  .mobile-inspection .btn {
    min-height: 48px; /* Larger for mobile */
  }
}
*/