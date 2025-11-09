import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Button,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';

/**
 * WorkOrderCard Component
 * Displays work order information in a card format
 * Shows priority, status, description, and action buttons
 */
const WorkOrderCard = ({ workOrder, onUpdate }) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onUpdate) {
      onUpdate(workOrder._id, { status: newStatus });
    }
  };

  return (
    <Card elevation={2} sx={{ mb: 2
 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Work Order #{workOrder.workOrderNumber || workOrder._id?.slice(-6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {format(new Date(workOrder.createdAt), 'PPP')}
            </Typography>
          </Box>
          <Box>
            <Chip
              label={workOrder.priority || 'Medium'}
              color={getPriorityColor(workOrder.priority)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={workOrder.status || 'Pending'}
              color={getStatusColor(workOrder.status)}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" paragraph>
          {workOrder.description || 'No description provided'}
        </Typography>

        {workOrder.notes && (
          <Typography variant="body2" color="text.secondary" paragraph>
            Notes: {workOrder.notes}
          </Typography>
        )}

        <Box display="flex" gap={1} mt={2}>
          {workOrder.status !== 'completed' && (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleStatusChange('in_progress')}
              >
                In Progress
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleStatusChange('completed')}
              >
                Complete
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default WorkOrderCard;
