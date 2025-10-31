// HydrantHub Work Order Management System
// Complete maintenance work order lifecycle with audit trail
// Municipal compliance and cost tracking

import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Row, Col, Alert, Badge, Modal, Table, ProgressBar } from 'react-bootstrap';
import { Tool, AlertTriangle, CheckCircle, Clock, DollarSign, Camera, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const WorkOrderManagement = () => {
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assigned_to: 'all',
    date_range: '30'
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    overdue: 0,
    total_cost: 0
  });

  // New Work Order State
  const [newWorkOrder, setNewWorkOrder] = useState({
    hydrant_id: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER',
    assigned_to: '',
    department: 'Water Operations',
    target_completion_date: '',
    estimated_cost: '',
    materials_required: []
  });

  useEffect(() => {
    fetchWorkOrders();
    fetchStats();
  }, [filters]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all' && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      const response = await API.get(`/maintenance/work-orders?${params.toString()}`);
      setWorkOrders(response.data.work_orders);
      setFilteredWorkOrders(response.data.work_orders);
      
    } catch (error) {
      console.error('Error fetching work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/maintenance/work-orders/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching work order stats:', error);
    }
  };

  const createWorkOrder = async () => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(newWorkOrder).forEach(key => {
        if (Array.isArray(newWorkOrder[key])) {
          formData.append(key, JSON.stringify(newWorkOrder[key]));
        } else {
          formData.append(key, newWorkOrder[key]);
        }
      });

      await API.post('/maintenance/work-orders', formData);
      
      setShowCreateModal(false);
      setNewWorkOrder({
        hydrant_id: '',
        title: '',
        description: '',
        priority: 'MEDIUM',
        category: 'OTHER',
        assigned_to: '',
        department: 'Water Operations',
        target_completion_date: '',
        estimated_cost: '',
        materials_required: []
      });
      
      await fetchWorkOrders();
      await fetchStats();
      
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Failed to create work order');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkOrderStatus = async (workOrderId, status, notes = '') => {
    try {
      await API.patch(`/maintenance/work-orders/${workOrderId}`, {
        status: status,
        completion_notes: notes
      });
      
      await fetchWorkOrders();
      await fetchStats();
      
    } catch (error) {
      console.error('Error updating work order:', error);
      alert('Failed to update work order status');
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'LOW': 'secondary',
      'MEDIUM': 'warning',
      'HIGH': 'danger',
      'CRITICAL': 'danger'
    };
    return <Badge bg={variants[priority]} className={priority === 'CRITICAL' ? 'animate-pulse' : ''}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'CREATED': 'secondary',
      'SCHEDULED': 'info',
      'IN_PROGRESS': 'primary',
      'ON_HOLD': 'warning',
      'COMPLETED': 'success',
      'CANCELLED': 'dark',
      'DEFERRED': 'warning'
    };
    return <Badge bg={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'VALVE_REPAIR': '🔧',
      'PAINT_MAINTENANCE': '🎨',
      'CAP_REPLACEMENT': '🔌',
      'CHAIN_REPLACEMENT': '⛓️',
      'BODY_REPAIR': '🔨',
      'DRAINAGE_ISSUE': '🌊',
      'ACCESSIBILITY_IMPROVEMENT': '♿️',
      'SAFETY_HAZARD': '⚠️',
      'OTHER': '💼'
    };
    return icons[category] || '💼';
  };

  const getProgressPercentage = (status) => {
    const progress = {
      'CREATED': 10,
      'SCHEDULED': 25,
      'IN_PROGRESS': 60,
      'ON_HOLD': 40,
      'COMPLETED': 100,
      'CANCELLED': 0,
      'DEFERRED': 20
    };
    return progress[status] || 0;
  };

  const isOverdue = (targetDate, status) => {
    return new Date(targetDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(status);
  };

  return (
    <div className="work-order-management">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1><Tool className="me-2" />Work Order Management</h1>
          <p className="text-muted mb-0">Maintenance work orders, cost tracking, and completion management</p>
        </div>
        <div>
          <Button variant="success" onClick={() => setShowCreateModal(true)}>
            Create New Work Order
          </Button>
        </div>
      </div>

      {/* Work Order Statistics */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <Tool className="text-primary mb-2" size={32} />
              <h3 className="text-primary">{stats.total}</h3>
              <p className="text-muted mb-0">Total Work Orders</p>
              <small className="text-muted">All time</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <CheckCircle className="text-success mb-2" size={32} />
              <h3 className="text-success">{stats.completed}</h3>
              <p className="text-muted mb-0">Completed</p>
              <small className="text-success">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <Clock className="text-warning mb-2" size={32} />
              <h3 className="text-warning">{stats.in_progress}</h3>
              <p className="text-muted mb-0">In Progress</p>
              <small className="text-warning">Active maintenance</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <DollarSign className="text-info mb-2" size={32} />
              <h3 className="text-info">${stats.total_cost.toLocaleString()}</h3>
              <p className="text-muted mb-0">Total Maintenance Cost</p>
              <small className="text-info">YTD spending</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filter Work Orders</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="CREATED">Created</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Select 
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="all">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Category</Form.Label>
                <Form.Select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="all">All Categories</option>
                  <option value="VALVE_REPAIR">Valve Repair</option>
                  <option value="PAINT_MAINTENANCE">Paint Maintenance</option>
                  <option value="CAP_REPLACEMENT">Cap Replacement</option>
                  <option value="SAFETY_HAZARD">Safety Hazard</option>
                  <option value="OTHER">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Assigned To</Form.Label>
                <Form.Select 
                  value={filters.assigned_to}
                  onChange={(e) => setFilters({...filters, assigned_to: e.target.value})}
                >
                  <option value="all">All Assignees</option>
                  <option value="Rich Cabral">Rich Cabral</option>
                  <option value="Maintenance Team">Maintenance Team</option>
                  <option value="External Contractor">External Contractor</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <Form.Select 
                  value={filters.date_range}
                  onChange={(e) => setFilters({...filters, date_range: e.target.value})}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={2} className="d-flex align-items-end">
              <Button variant="outline-primary" onClick={fetchWorkOrders} className="w-100">
                Apply Filters
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Work Orders Table */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Active Work Orders</h5>
          <div>
            <small className="text-muted me-3">Showing {filteredWorkOrders.length} results</small>
            <Button variant="outline-secondary" size="sm">
              Export to Excel
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredWorkOrders.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>WO #</th>
                    <th>Hydrant</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map(wo => (
                    <tr key={wo.id} className={isOverdue(wo.target_completion_date, wo.status) ? 'table-danger' : ''}>
                      <td>
                        <code className="fw-bold">{wo.work_order_number}</code>
                        {isOverdue(wo.target_completion_date, wo.status) && (
                          <br /><small className="text-danger fw-bold">OVERDUE</small>
                        )}
                      </td>
                      <td>
                        <Link to={`/hydrants/${wo.hydrant_id}`} className="fw-bold">
                          {wo.hydrant_number}
                        </Link>
                        <br />
                        <small className="text-muted">{wo.location_address}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-2">{getCategoryIcon(wo.category)}</span>
                          <div>
                            <strong>{wo.title}</strong>
                            <br />
                            <small className="text-muted">{wo.description.substring(0, 50)}...</small>
                          </div>
                        </div>
                      </td>
                      <td>{wo.category.replace('_', ' ')}</td>
                      <td>{getPriorityBadge(wo.priority)}</td>
                      <td>{getStatusBadge(wo.status)}</td>
                      <td>
                        <div style={{minWidth: '120px'}}>
                          <ProgressBar 
                            variant={wo.status === 'COMPLETED' ? 'success' : 'primary'}
                            now={getProgressPercentage(wo.status)} 
                            label={`${getProgressPercentage(wo.status)}%`}
                            style={{height: '20px'}}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={16} className="me-1" />
                          <div>
                            <small>{wo.assigned_to || 'Unassigned'}</small>
                            <br />
                            <small className="text-muted">{wo.department}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <small>{new Date(wo.target_completion_date).toLocaleDateString()}</small>
                        {isOverdue(wo.target_completion_date, wo.status) && (
                          <br /><small className="text-danger">Overdue by {Math.abs(Math.floor((new Date(wo.target_completion_date) - new Date()) / (1000 * 60 * 60 * 24)))} days</small>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong>${wo.actual_cost || wo.estimated_cost || 0}</strong>
                          <br />
                          <small className="text-muted">{wo.labor_hours || 0}h</small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => {
                              setSelectedWorkOrder(wo);
                              setShowModal(true);
                            }}
                          >
                            View
                          </Button>
                          
                          {wo.status === 'IN_PROGRESS' && (
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => updateWorkOrderStatus(wo.id, 'COMPLETED', 'Completed via dashboard')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-4">
              <Tool className="text-muted mb-3" size={48} />
              <h5 className="text-muted">No work orders found</h5>
              <p className="text-muted">No work orders match your current filter criteria.</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                Create Your First Work Order
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Work Order Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedWorkOrder && (
              <>
                <span className="me-2">{getCategoryIcon(selectedWorkOrder.category)}</span>
                Work Order: {selectedWorkOrder.work_order_number}
              </>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWorkOrder && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Hydrant:</strong> {selectedWorkOrder.hydrant_number}<br />
                  <strong>Location:</strong> {selectedWorkOrder.location_address}<br />
                  <strong>Created:</strong> {new Date(selectedWorkOrder.created_date).toLocaleDateString()}
                </Col>
                <Col md={6}>
                  <strong>Priority:</strong> {getPriorityBadge(selectedWorkOrder.priority)}<br />
                  <strong>Status:</strong> {getStatusBadge(selectedWorkOrder.status)}<br />
                  <strong>Assigned To:</strong> {selectedWorkOrder.assigned_to || 'Unassigned'}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col>
                  <h6>Description:</h6>
                  <p>{selectedWorkOrder.description}</p>
                </Col>
              </Row>
              
              {selectedWorkOrder.materials_required && selectedWorkOrder.materials_required.length > 0 && (
                <Row className="mb-3">
                  <Col>
                    <h6>Materials Required:</h6>
                    <ul>
                      {selectedWorkOrder.materials_required.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </Col>
                </Row>
              )}
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Estimated Cost:</strong> ${selectedWorkOrder.estimated_cost || 0}<br />
                  <strong>Actual Cost:</strong> ${selectedWorkOrder.actual_cost || 'TBD'}<br />
                  <strong>Labor Hours:</strong> {selectedWorkOrder.labor_hours || 'TBD'}
                </Col>
                <Col md={6}>
                  <strong>Target Completion:</strong> {new Date(selectedWorkOrder.target_completion_date).toLocaleDateString()}<br />
                  {selectedWorkOrder.actual_completion_date && (
                    <><strong>Completed:</strong> {new Date(selectedWorkOrder.actual_completion_date).toLocaleDateString()}<br /></>
                  )}
                </Col>
              </Row>
              
              {selectedWorkOrder.completion_notes && (
                <Row className="mb-3">
                  <Col>
                    <h6>Completion Notes:</h6>
                    <p className="bg-light p-3 rounded">{selectedWorkOrder.completion_notes}</p>
                  </Col>
                </Row>
              )}
              
              <Row>
                <Col>
                  <div className="d-flex gap-2">
                    {selectedWorkOrder.status !== 'COMPLETED' && (
                      <>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => updateWorkOrderStatus(selectedWorkOrder.id, 'IN_PROGRESS')}
                          disabled={selectedWorkOrder.status === 'IN_PROGRESS'}
                        >
                          Start Work
                        </Button>
                        
                        <Button 
                          variant="success" 
                          size="sm"
                          onClick={() => updateWorkOrderStatus(selectedWorkOrder.id, 'COMPLETED')}
                        >
                          Mark Complete
                        </Button>
                        
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => updateWorkOrderStatus(selectedWorkOrder.id, 'ON_HOLD')}
                        >
                          Put On Hold
                        </Button>
                      </>
                    )}
                    
                    <Button variant="outline-secondary" size="sm">
                      Edit Details
                    </Button>
                  </div>
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Work Order Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Work Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hydrant ID *</Form.Label>
                  <Form.Control 
                    type="text"
                    value={newWorkOrder.hydrant_id}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, hydrant_id: e.target.value})}
                    placeholder="e.g., HYD-MLT-2025-001"
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority *</Form.Label>
                  <Form.Select 
                    value={newWorkOrder.priority}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, priority: e.target.value})}
                  >
                    <option value="LOW">Low - Routine Maintenance</option>
                    <option value="MEDIUM">Medium - Schedule within 3 months</option>
                    <option value="HIGH">High - Schedule within 1 month</option>
                    <option value="CRITICAL">Critical - Immediate Action</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select 
                    value={newWorkOrder.category}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, category: e.target.value})}
                  >
                    <option value="VALVE_REPAIR">Valve Repair</option>
                    <option value="PAINT_MAINTENANCE">Paint Maintenance</option>
                    <option value="CAP_REPLACEMENT">Cap Replacement</option>
                    <option value="CHAIN_REPLACEMENT">Chain Replacement</option>
                    <option value="BODY_REPAIR">Body Repair</option>
                    <option value="DRAINAGE_ISSUE">Drainage Issue</option>
                    <option value="ACCESSIBILITY_IMPROVEMENT">Accessibility Improvement</option>
                    <option value="SAFETY_HAZARD">Safety Hazard</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Completion Date *</Form.Label>
                  <Form.Control 
                    type="date"
                    value={newWorkOrder.target_completion_date}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, target_completion_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Work Order Title *</Form.Label>
              <Form.Control 
                type="text"
                value={newWorkOrder.title}
                onChange={(e) => setNewWorkOrder({...newWorkOrder, title: e.target.value})}
                placeholder="e.g., Replace damaged valve cap and chain"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Detailed Description *</Form.Label>
              <Form.Control 
                as="textarea"
                rows={4}
                value={newWorkOrder.description}
                onChange={(e) => setNewWorkOrder({...newWorkOrder, description: e.target.value})}
                placeholder="Describe the issue, required work, safety considerations, and any special instructions..."
                required
              />
            </Form.Group>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Assigned To</Form.Label>
                  <Form.Control 
                    type="text"
                    value={newWorkOrder.assigned_to}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, assigned_to: e.target.value})}
                    placeholder="Name or team"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select 
                    value={newWorkOrder.department}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, department: e.target.value})}
                  >
                    <option value="Water Operations">Water Operations</option>
                    <option value="Public Works">Public Works</option>
                    <option value="Fire Department">Fire Department</option>
                    <option value="External Contractor">External Contractor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Estimated Cost ($)</Form.Label>
                  <Form.Control 
                    type="number"
                    step="0.01"
                    min="0"
                    value={newWorkOrder.estimated_cost}
                    onChange={(e) => setNewWorkOrder({...newWorkOrder, estimated_cost: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={createWorkOrder} disabled={loading}>
            {loading ? 'Creating...' : 'Create Work Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WorkOrderManagement;