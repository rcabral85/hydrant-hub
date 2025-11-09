import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, PictureAsPdf } from '@mui/icons-material';
import { format } from 'date-fns';

/**
 * InspectionList Component
 * Displays a list of inspections for a selected hydrant
 * Shows inspection details and provides actions to view details or generate PDF
 */
const InspectionList = ({ hydrantId, inspections, loading, error, onViewDetails, onGeneratePdf }) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!hydrantId) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please select a hydrant to view inspection history
      </Alert>
    );
  }

  if (inspections.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No inspections found for this hydrant
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'completed':
        return 'success';
      case 'failed':
      case 'needs_repair':
        return 'error';
      case 'in_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'visual':
        return 'Visual Inspection';
      case 'valve':
        return 'Valve Operation';
      case 'flow_test':
        return 'Flow Test';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {inspections.map((inspection) => (
          <Card key={inspection._id} elevation={2}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    {getTypeLabel(inspection.type)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Date: {format(new Date(inspection.inspectionDate), 'PPP')}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Inspector: {inspection.inspector}
                  </Typography>

                  {inspection.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Notes: {inspection.notes}
                    </Typography>
                  )}

                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label={inspection.status || 'Completed'}
                      color={getStatusColor(inspection.status)}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    {inspection.workOrderRequired && (
                      <Chip
                        label="Work Order Required"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                <Box>
                  <IconButton
                    color="primary"
                    onClick={() => onViewDetails(inspection)}
                    title="View Details"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    color="secondary"
                    onClick={() => onGeneratePdf(inspection)}
                    title="Generate PDF"
                  >
                    <PictureAsPdf />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default InspectionList;
