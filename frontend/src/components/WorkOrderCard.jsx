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
