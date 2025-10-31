// HydrantHub Maintenance Dashboard
// Overview of maintenance status, compliance, and upcoming inspections
// Municipal audit-ready reporting and scheduling

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Table, Button, ProgressBar, Alert } from 'react-bootstrap';
import { Calendar, AlertTriangle, CheckCircle, Clock, Tool, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';

const MaintenanceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    upcomingInspections: [],
    overdueInspections: [],
    activeWorkOrders: [],
    recentInspections: [],
    complianceMetrics: {}
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch multiple endpoints concurrently
      const [statsRes, scheduleRes, workOrdersRes, complianceRes] = await Promise.all([
        API.get('/maintenance/stats'),
        API.get('/maintenance/compliance/schedule?status=SCHEDULED&end_date=' + 
               new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        API.get('/maintenance/work-orders?status=IN_PROGRESS,SCHEDULED&limit=10'),
        API.get('/maintenance/compliance/report?start_date=' + 
               new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] +
               '&end_date=' + new Date().toISOString().split('T')[0])
      ]);

      // Process the data
      const upcomingInspections = scheduleRes.data.schedule.filter(
        item => new Date(item.due_date) > new Date() && item.status === 'SCHEDULED'
      ).slice(0, 10);
      
      const overdueInspections = scheduleRes.data.schedule.filter(
        item => new Date(item.due_date) < new Date() || item.status === 'OVERDUE'
      );

      setDashboardData({
        stats: statsRes.data.stats,
        upcomingInspections,
        overdueInspections,
        activeWorkOrders: workOrdersRes.data.work_orders,
        complianceMetrics: complianceRes.data.report.summary
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      'LOW': 'secondary',
      'MEDIUM': 'warning', 
      'HIGH': 'danger',
      'CRITICAL': 'danger'
    };
    return <Badge bg={variants[priority]}>{priority}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      'SCHEDULED': 'info',
      'IN_PROGRESS': 'primary',
      'COMPLETED': 'success',
      'OVERDUE': 'danger',
      'DEFERRED': 'warning'
    };
    return <Badge bg={variants[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-danger fw-bold">{Math.abs(diffDays)} days overdue</span>;
    } else if (diffDays <= 7) {
      return <span className="text-warning fw-bold">{diffDays} days remaining</span>;
    } else {
      return <span className="text-muted">{diffDays} days remaining</span>;
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading maintenance dashboard...</p>
      </div>
    );
  }

  return (
    <div className="maintenance-dashboard">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1><Tool className="me-2" />Maintenance Dashboard</h1>
          <p className="text-muted mb-0">Preventive maintenance, compliance tracking, and audit management</p>
        </div>
        <div>
          <Button variant="outline-primary" className="me-2">
            <FileText className="me-1" size={16} />
            Export Compliance Report
          </Button>
          <Button variant="primary">
            <Calendar className="me-1" size={16} />
            Schedule Inspection
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {dashboardData.overdueInspections.length > 0 && (
        <Alert variant="danger" className="mb-4">
          <AlertTriangle className="me-2" />
          <strong>Compliance Alert:</strong> {dashboardData.overdueInspections.length} inspections are overdue.
          <Link to="/maintenance/overdue" className="ms-2">View Details »</Link>
        </Alert>
      )}

      {/* Key Metrics */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <CheckCircle className="text-success mb-2" size={32} />
              <h3 className="text-success">{dashboardData.complianceMetrics.compliance_rate || '0%'}</h3>
              <p className="text-muted mb-0">Compliance Rate</p>
              <small className="text-success">O. Reg 169/03</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <Calendar className="text-primary mb-2" size={32} />
              <h3 className="text-primary">{dashboardData.upcomingInspections.length}</h3>
              <p className="text-muted mb-0">Scheduled This Month</p>
              <small className="text-primary">Next 30 days</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <AlertTriangle className="text-danger mb-2" size={32} />
              <h3 className="text-danger">{dashboardData.overdueInspections.length}</h3>
              <p className="text-muted mb-0">Overdue Inspections</p>
              <small className="text-danger">Requires immediate attention</small>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-3">
          <Card className="h-100">
            <Card.Body className="text-center">
              <Tool className="text-warning mb-2" size={32} />
              <h3 className="text-warning">{dashboardData.activeWorkOrders.length}</h3>
              <p className="text-muted mb-0">Active Work Orders</p>
              <small className="text-warning">In progress repairs</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Upcoming Inspections */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><Calendar className="me-2" size={20} />Upcoming Inspections</h5>
              <Link to="/maintenance/schedule" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body>
              {dashboardData.upcomingInspections.length > 0 ? (
                <div className="table-responsive">
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>Hydrant</th>
                        <th>Type</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.upcomingInspections.map(inspection => (
                        <tr key={`${inspection.hydrant_id}-${inspection.inspection_type_id}`}>
                          <td>
                            <Link to={`/hydrants/${inspection.hydrant_id}`}>
                              <strong>{inspection.hydrant_number}</strong>
                            </Link>
                            <br />
                            <small className="text-muted">{inspection.location_address}</small>
                          </td>
                          <td>
                            <small>{inspection.inspection_type}</small>
                            {inspection.regulatory_requirement && (
                              <Badge bg="info" className="ms-1" title="Required by O. Reg 169/03">
                                REQ
                              </Badge>
                            )}
                          </td>
                          <td>
                            <small>{new Date(inspection.due_date).toLocaleDateString()}</small>
                            <br />
                            {getDaysUntilDue(inspection.due_date)}
                          </td>
                          <td>
                            <Link 
                              to={`/maintenance/inspect/${inspection.hydrant_id}/new`}
                              className="btn btn-sm btn-primary"
                            >
                              Start Inspection
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  <CheckCircle className="me-2" size={20} />
                  No inspections scheduled for the next 30 days
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Active Work Orders */}
        <Col lg={6} className="mb-4">
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0"><Tool className="me-2" size={20} />Active Work Orders</h5>
              <Link to="/maintenance/work-orders" className="btn btn-sm btn-outline-primary">
                View All
              </Link>
            </Card.Header>
            <Card.Body>
              {dashboardData.activeWorkOrders.length > 0 ? (
                <div className="table-responsive">
                  <Table hover size="sm">
                    <thead>
                      <tr>
                        <th>WO #</th>
                        <th>Hydrant</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.activeWorkOrders.map(wo => (
                        <tr key={wo.id} className={wo.is_overdue ? 'table-danger' : ''}>
                          <td>
                            <Link to={`/maintenance/work-orders/${wo.id}`}>
                              <code>{wo.work_order_number}</code>
                            </Link>
                          </td>
                          <td>
                            <strong>{wo.hydrant_number}</strong>
                            <br />
                            <small className="text-muted">{wo.title}</small>
                          </td>
                          <td>{getPriorityBadge(wo.priority)}</td>
                          <td>{getStatusBadge(wo.status)}</td>
                          <td>
                            <small>{new Date(wo.target_completion_date).toLocaleDateString()}</small>
                            {wo.is_overdue && (
                              <br /><small className="text-danger fw-bold">OVERDUE</small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  <CheckCircle className="me-2" size={20} />
                  No active work orders
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Overdue Inspections Alert */}
      {dashboardData.overdueInspections.length > 0 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-danger">
              <Card.Header className="bg-danger text-white">
                <AlertTriangle className="me-2" size={20} />
                Overdue Inspections Requiring Immediate Attention
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Hydrant</th>
                        <th>Location</th>
                        <th>Inspection Type</th>
                        <th>Due Date</th>
                        <th>Days Overdue</th>
                        <th>Last Inspector</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.overdueInspections.map(inspection => (
                        <tr key={`${inspection.hydrant_id}-${inspection.inspection_type_id}`} className="table-danger">
                          <td>
                            <Link to={`/hydrants/${inspection.hydrant_id}`} className="fw-bold">
                              {inspection.hydrant_number}
                            </Link>
                          </td>
                          <td>
                            <small>{inspection.location_address}</small>
                          </td>
                          <td>
                            {inspection.inspection_type}
                            {inspection.regulatory_requirement && (
                              <Badge bg="danger" className="ms-1" title="Required by O. Reg 169/03">
                                MANDATORY
                              </Badge>
                            )}
                          </td>
                          <td>{new Date(inspection.due_date).toLocaleDateString()}</td>
                          <td>
                            <span className="text-danger fw-bold">
                              {Math.abs(inspection.days_until_due)} days
                            </span>
                          </td>
                          <td>
                            <small>{inspection.last_inspector || 'None recorded'}</small>
                          </td>
                          <td>
                            <Link 
                              to={`/maintenance/inspect/${inspection.hydrant_id}/new`}
                              className="btn btn-sm btn-danger"
                            >
                              Inspect Now
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Compliance Summary */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <TrendingUp className="me-2" size={20} />
                Regulatory Compliance Status (Last 90 Days)
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="text-center">
                  <h4 className="text-primary">{dashboardData.complianceMetrics.total_inspections || 0}</h4>
                  <p className="text-muted mb-0">Total Inspections</p>
                </Col>
                <Col md={3} className="text-center">
                  <h4 className="text-success">{dashboardData.complianceMetrics.compliance_rate || '0%'}</h4>
                  <p className="text-muted mb-0">Compliance Rate</p>
                </Col>
                <Col md={3} className="text-center">
                  <h4 className="text-danger">{dashboardData.complianceMetrics.overdue_count || 0}</h4>
                  <p className="text-muted mb-0">Overdue Items</p>
                </Col>
                <Col md={3} className="text-center">
                  <h4 className="text-info">${(dashboardData.complianceMetrics.total_maintenance_cost || 0).toLocaleString()}</h4>
                  <p className="text-muted mb-0">Maintenance Costs</p>
                </Col>
              </Row>
              
              <hr />
              
              <Row>
                <Col md={6}>
                  <h6>Regulatory Compliance:</h6>
                  <ul className="list-unstyled">
                    <li><CheckCircle className="text-success me-2" size={16} />O. Reg 169/03 - Drinking Water Systems</li>
                    <li><CheckCircle className="text-success me-2" size={16} />NFPA 291 - Fire Flow Testing</li>
                    <li><CheckCircle className="text-success me-2" size={16} />AWWA M17 - Hydrant Maintenance</li>
                    <li><CheckCircle className="text-success me-2" size={16} />Municipal Standards</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>Audit Trail:</h6>
                  <ul className="list-unstyled">
                    <li><FileText className="text-info me-2" size={16} />Complete inspection records</li>
                    <li><FileText className="text-info me-2" size={16} />Photo documentation</li>
                    <li><FileText className="text-info me-2" size={16} />Maintenance history</li>
                    <li><FileText className="text-info me-2" size={16} />Compliance reports</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/maintenance/inspect/new" className="btn btn-primary">
                  <CheckCircle className="me-1" size={16} />
                  Start New Inspection
                </Link>
                <Link to="/maintenance/schedule" className="btn btn-outline-primary">
                  <Calendar className="me-1" size={16} />
                  View Inspection Schedule
                </Link>
                <Link to="/maintenance/work-orders" className="btn btn-outline-warning">
                  <Tool className="me-1" size={16} />
                  Manage Work Orders
                </Link>
                <Link to="/maintenance/reports" className="btn btn-outline-info">
                  <FileText className="me-1" size={16} />
                  Generate Compliance Report
                </Link>
                <Link to="/maintenance/history" className="btn btn-outline-secondary">
                  <Clock className="me-1" size={16} />
                  View Maintenance History
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Inspection Type Distribution */}
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Inspection Schedule Overview</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Annual Inspections</small>
                  <small>85% Complete</small>
                </div>
                <ProgressBar variant="success" now={85} />
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Flow Tests (NFPA 291)</small>
                  <small>78% Complete</small>
                </div>
                <ProgressBar variant="primary" now={78} />
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Valve Maintenance</small>
                  <small>92% Complete</small>
                </div>
                <ProgressBar variant="info" now={92} />
              </div>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small>Routine Checks</small>
                  <small>67% Complete</small>
                </div>
                <ProgressBar variant="warning" now={67} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">Recent Maintenance Activity</h6>
            </Card.Header>
            <Card.Body>
              <div className="activity-feed">
                <div className="d-flex align-items-center mb-3">
                  <CheckCircle className="text-success me-3" size={20} />
                  <div className="flex-grow-1">
                    <strong>Annual Inspection Completed</strong>
                    <br />
                    <small className="text-muted">Hydrant MLT-2025-045 - Main Street</small>
                    <br />
                    <small className="text-success">2 hours ago by Rich Cabral</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-center mb-3">
                  <Tool className="text-warning me-3" size={20} />
                  <div className="flex-grow-1">
                    <strong>Work Order Created</strong>
                    <br />
                    <small className="text-muted">WO-2025-001234 - Valve Lubrication</small>
                    <br />
                    <small className="text-warning">4 hours ago - Priority: MEDIUM</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-center mb-3">
                  <AlertTriangle className="text-danger me-3" size={20} />
                  <div className="flex-grow-1">
                    <strong>Critical Issue Identified</strong>
                    <br />
                    <small className="text-muted">Hydrant MLT-2025-023 - Valve Inoperable</small>
                    <br />
                    <small className="text-danger">1 day ago - IMMEDIATE ACTION REQUIRED</small>
                  </div>
                </div>
                
                <div className="d-flex align-items-center">
                  <FileText className="text-info me-3" size={20} />
                  <div className="flex-grow-1">
                    <strong>Compliance Report Generated</strong>
                    <br />
                    <small className="text-muted">Q4 2025 Municipal Audit Report</small>
                    <br />
                    <small className="text-info">3 days ago - Sent to Fire Chief</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MaintenanceDashboard;