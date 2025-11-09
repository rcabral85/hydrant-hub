import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import VisualInspectionForm from './VisualInspectionForm';
import ValveInspectionForm from './ValveInspectionForm';

const InspectionForm = ({ hydrantId, onInspectionCreated }) => {
  const [inspectionType, setInspectionType] = useState('');

  if (!hydrantId) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Please select a hydrant to create an inspection
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="inspection-type-label">Inspection Type</InputLabel>
        <Select
          labelId="inspection-type-label"
          id="inspection-type"
          value={inspectionType}
          label="Inspection Type"
          onChange={(e) => setInspectionType(e.target.value)}
        >
          <MenuItem value="visual">Visual Inspection</MenuItem>
          <MenuItem value="valve">Valve Operation Test</MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ mt: 3 }}>
        {inspectionType === 'visual' && (
          <VisualInspectionForm
            hydrantId={hydrantId}
            onSuccess={onInspectionCreated}
          />
        )}
        {inspectionType === 'valve' && (
          <ValveInspectionForm
            hydrantId={hydrantId}
            onSuccess={onInspectionCreated}
          />
        )}
      </Box>
    </Box>
  );
};

export default InspectionForm;
