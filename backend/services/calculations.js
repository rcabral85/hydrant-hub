# Create the core calculation module for NFPA 291 flow tests

calculations_js = """/**

* NFPA 291 Flow Test Calculations

* This module implements the mathematical formulas required by NFPA 291

* for fire hydrant flow testing and available fire flow calculations.

* @module calculations

*/

/**

* Calculate flow from a single hydrant outlet using pitot pressure

* Formula: Q = 29.83 × c × d² × √P

* @param {number} pitotPressurePSI - Pitot gauge pressure reading in PSI

* @param {number} outletDiameterInches - Outlet diameter in inches (typically 2.5, 4.5, or 6.0)

* @param {number} coefficientOfDischarge - Discharge coefficient (0.70-0.90, typically 0.90)

* @returns {number} Flow in gallons per minute (GPM)

* @example

* // 2.5" outlet, 50 PSI pitot, smooth outlet (0.90 coefficient)

* const flow = calculateOutletFlow(50, 2.5, 0.90);

* console.log(flow); // 1188.38 GPM

*/

function calculateOutletFlow(pitotPressurePSI, outletDiameterInches, coefficientOfDischarge = 0.90) {

  if (pitotPressurePSI <= 0) {

    throw new Error('Pitot pressure must be greater than 0');

  }

  if (outletDiameterInches <= 0) {

    throw new Error('Outlet diameter must be greater than 0');

  }

  if (coefficientOfDischarge < 0.70 || coefficientOfDischarge > 0.90) {

    console.warn('Coefficient of discharge outside typical range (0.70-0.90)');

  }

  const Q = 29.83 * coefficientOfDischarge * Math.pow(outletDiameterInches, 2) * Math.sqrt(pitotPressurePSI);

  return Math.round(Q * 100) / 100; // Round to 2 decimal places

}

/**

* Calculate available fire flow at 20 PSI residual pressure

* Formula: Q_R = Q_F × ((S - 20) / (S - R))^0.54

* @param {number} totalFlowGPM - Total measured flow during test (sum of all outlets)

* @param {number} staticPressurePSI - Static pressure before opening hydrants

* @param {number} residualPressurePSI - Residual pressure during flow test

* @param {number} desiredResidualPSI - Desired residual pressure (typically 20 PSI)

* @returns {number} Available fire flow at desired residual pressure (GPM)

* @example

* // 1500 GPM measured, 80 PSI static, 60 PSI residual

* const availableFlow = calculateAvailableFireFlow(1500, 80, 60, 20);

* console.log(availableFlow); // 2595 GPM

*/

function calculateAvailableFireFlow(

  totalFlowGPM,

  staticPressurePSI,

  residualPressurePSI,

  desiredResidualPSI = 20

) {

  if (totalFlowGPM <= 0) {

    throw new Error('Total flow must be greater than 0');

  }

  if (staticPressurePSI <= residualPressurePSI) {

    throw new Error('Static pressure must be greater than residual pressure');

  }

  if (residualPressurePSI <= desiredResidualPSI) {

    console.warn('Residual pressure is already at or below desired level');

  }

  const hr = staticPressurePSI - desiredResidualPSI; // Pressure drop to desired residual

  const hf = staticPressurePSI - residualPressurePSI; // Pressure drop during test

  const QR = totalFlowGPM * Math.pow(hr / hf, 0.54);

  return Math.round(QR * 100) / 100;

}

/**

* Classify hydrant based on NFPA flow rating

* @param {number} availableFlowGPM - Available fire flow at 20 PSI

* @returns {string} NFPA classification ('AA', 'A', 'B', or 'C')

* @example

* const classification = classifyHydrantNFPA(1200);

* console.log(classification); // 'A'

*/

function classifyHydrantNFPA(availableFlowGPM) {

  if (availableFlowGPM >= 1500) {

    return 'AA';

  } else if (availableFlowGPM >= 1000) {

    return 'A';

  } else if (availableFlowGPM >= 500) {

    return 'B';

  } else {

    return 'C';

  }

}

/**

* Get color code for NFPA classification

* @param {string} nfpaClass - NFPA classification ('AA', 'A', 'B', or 'C')

* @returns {string} Hex color code

*/

function getNFPAColor(nfpaClass) {

  const colors = {

    'AA': '#0066CC', // Blue

    'A': '#00AA00', // Green

    'B': '#FF8800', // Orange

    'C': '#CC0000' // Red

  };

  return colors[nfpaClass] || '#808080'; // Gray for unknown

}

/**

* Calculate distance between two hydrants using GPS coordinates

* Uses Haversine formula for great-circle distance

* @param {number} lat1 - Latitude of first hydrant

* @param {number} lon1 - Longitude of first hydrant

* @param {number} lat2 - Latitude of second hydrant

* @param {number} lon2 - Longitude of second hydrant

* @returns {number} Distance in feet

*/

function calculateDistanceBetweenHydrants(lat1, lon1, lat2, lon2) {

  const R = 6371000; // Earth's radius in meters

  const φ1 = lat1 * Math.PI / 180;

  const φ2 = lat2 * Math.PI / 180;

  const Δφ = (lat2 - lat1) * Math.PI / 180;

  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +

            Math.cos(φ1) * Math.cos(φ2) *

            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = R * c;

  const distanceFeet = distanceMeters * 3.28084;

  return Math.round(distanceFeet);

}

/**

* Generate data points for N=1.85 water supply curve

* Used for graphing available flow at different residual pressures

* @param {number} measuredFlowGPM - Flow measured during test

* @param {number} staticPressurePSI - Static pressure

* @param {number} residualPressurePSI - Residual pressure during test

* @returns {Array<{pressure: number, flow: number}>} Array of pressure/flow points

*/

function generateWaterSupplyCurve(measuredFlowGPM, staticPressurePSI, residualPressurePSI) {

  const points = [];

  // Generate points from 0 to static pressure in 5 PSI increments

  for (let desiredResidual = 0; desiredResidual <= staticPressurePSI; desiredResidual += 5) {

    if (desiredResidual < residualPressurePSI) {

      const hr = staticPressurePSI - desiredResidual;

      const hf = staticPressurePSI - residualPressurePSI;

      const flow = measuredFlowGPM * Math.pow(hr / hf, 0.54);

      points.push({

        pressure: desiredResidual,

        flow: Math.round(flow)

      });

    }

  }

  return points;

}

/**

* Complete flow test calculation

* Processes all outlets and returns comprehensive results

* @param {Object} testData - Flow test input data

* @returns {Object} Complete flow test results

*/

function performFlowTestCalculation(testData) {

  const {

    staticPressurePSI,

    residualPressurePSI,

    outlets,

    testHydrantLocation,

    flowHydrantLocations

  } = testData;

  // Calculate flow for each outlet

  const outletFlows = outlets.map(outlet => {

    const flow = calculateOutletFlow(

      outlet.pitotPressurePSI,

      outlet.diameterInches,

      outlet.coefficientOfDischarge

    );

    return {

      ...outlet,

      calculatedFlowGPM: flow

    };

  });

  // Sum total flow

  const totalFlowGPM = outletFlows.reduce((sum, outlet) => sum + outlet.calculatedFlowGPM, 0);

  // Calculate available fire flow at 20 PSI

  const availableFlow20PSI = calculateAvailableFireFlow(

    totalFlowGPM,

    staticPressurePSI,

    residualPressurePSI,

    20

  );

  // Classify hydrant

  const nfpaClassification = classifyHydrantNFPA(availableFlow20PSI);

  const colorCode = getNFPAColor(nfpaClassification);

  // Calculate distances

  const distances = flowHydrantLocations.map(loc => ({

    hydrantId: loc.hydrantId,

    distanceFeet: calculateDistanceBetweenHydrants(

      testHydrantLocation.lat,

      testHydrantLocation.lon,

      loc.lat,

      loc.lon

    )

  }));

  // Generate water supply curve

  const waterSupplyCurve = generateWaterSupplyCurve(

    totalFlowGPM,

    staticPressurePSI,

    residualPressurePSI

  );

  return {

    outletFlows,

    totalFlowGPM: Math.round(totalFlowGPM * 100) / 100,

    availableFlow20PSI: Math.round(availableFlow20PSI * 100) / 100,

    nfpaClassification,

    colorCode,

    distances,

    waterSupplyCurve,

    testConditions: {

      staticPressurePSI,

      residualPressurePSI,

      pressureDropPSI: staticPressurePSI - residualPressurePSI

    }

  };

}

// Export functions for use in Node.js

if (typeof module !== 'undefined' && module.exports) {

  module.exports = {

    calculateOutletFlow,

    calculateAvailableFireFlow,

    classifyHydrantNFPA,

    getNFPAColor,

    calculateDistanceBetweenHydrants,

    generateWaterSupplyCurve,

    performFlowTestCalculation

  };

}

// Example usage and testing

if (typeof require !== 'undefined' && require.main === module) {

  console.log('NFPA 291 Flow Test Calculation Examples\n');

  // Example 1: Single outlet flow calculation

  console.log('Example 1: 2.5" outlet, 50 PSI pitot, 0.90 coefficient');

  const flow1 = calculateOutletFlow(50, 2.5, 0.90);

  console.log(` Result: ${flow1} GPM\n`);

  // Example 2: Available fire flow calculation

  console.log('Example 2: 1500 GPM measured, 80 PSI static, 60 PSI residual');

  const availableFlow = calculateAvailableFireFlow(1500, 80, 60, 20);

  console.log(` Available flow at 20 PSI: ${availableFlow} GPM`);

  console.log(` Classification: ${classifyHydrantNFPA(availableFlow)}\n`);

  // Example 3: Complete flow test

  console.log('Example 3: Complete flow test with 2 outlets');

  const testResults = performFlowTestCalculation({

    staticPressurePSI: 75,

    residualPressurePSI: 55,

    outlets: [

      { pitotPressurePSI: 45, diameterInches: 2.5, coefficientOfDischarge: 0.90 },

      { pitotPressurePSI: 42, diameterInches: 2.5, coefficientOfDischarge: 0.90 }

    ],

    testHydrantLocation: { lat: 43.5183, lon: -79.8687 },

    flowHydrantLocations: [

      { hydrantId: 'H-002', lat: 43.5185, lon: -79.8690 }

    ]

  });

  console.log(' Results:', JSON.stringify(testResults, null, 2));

}
