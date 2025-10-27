/**
 * NFPA 291 Flow Testing Calculations
 * Professional fire hydrant flow testing calculations per NFPA 291 standard
 * Built by Trident Systems for water operators and fire departments
 */

class NFPA291Calculator {
  constructor() {
    // Standard outlet coefficients (can be customized per hydrant)
    this.DEFAULT_COEFFICIENTS = {
      '2.5': 0.90,  // 2.5" outlets
      '4.5': 0.85,  // 4.5" outlets  
      '5.0': 0.85,  // 5" outlets
      '6.0': 0.80   // 6" outlets
    };
    
    // NFPA 291 flow classification thresholds (GPM at 20 PSI residual)
    this.NFPA_CLASSES = {
      AA: { min: 1500, color: '#00FF00' },  // Green
      A:  { min: 1000, max: 1499, color: '#FFFF00' },  // Yellow
      B:  { min: 500,  max: 999,  color: '#FFA500' },  // Orange
      C:  { min: 0,    max: 499,  color: '#FF0000' }   // Red
    };
  }

  /**
   * Calculate flow from pitot pressure using NFPA 291 formula
   * Q = 29.83 × c × d² × √P
   * 
   * @param {number} pitotPressure - Pressure reading from pitot gauge (PSI)
   * @param {number} outletDiameter - Outlet diameter (inches)
   * @param {number} coefficient - Outlet coefficient (0.80-0.95)
   * @returns {number} Flow rate in GPM
   */
  calculateOutletFlow(pitotPressure, outletDiameter, coefficient = null) {
    if (!pitotPressure || !outletDiameter) {
      throw new Error('Pitot pressure and outlet diameter are required');
    }
    
    if (pitotPressure < 0 || outletDiameter <= 0) {
      throw new Error('Invalid pressure or diameter values');
    }

    // Use default coefficient if not provided
    const c = coefficient || this.DEFAULT_COEFFICIENTS[outletDiameter.toString()] || 0.85;
    
    // Validate coefficient range
    if (c < 0.7 || c > 1.0) {
      console.warn(`Coefficient ${c} is outside typical range (0.7-1.0)`);
    }

    // NFPA 291 flow formula
    const flow = 29.83 * c * Math.pow(outletDiameter, 2) * Math.sqrt(pitotPressure);
    
    return Math.round(flow);
  }

  /**
   * Calculate total flow from multiple outlets
   * 
   * @param {Array} outlets - Array of outlet data: {size, pitotPressure, coefficient?}
   * @returns {Object} Total flow and individual outlet flows
   */
  calculateTotalFlow(outlets) {
    if (!Array.isArray(outlets) || outlets.length === 0) {
      throw new Error('Outlets array is required');
    }

    const outletFlows = outlets.map((outlet, index) => {
      try {
        const flow = this.calculateOutletFlow(
          outlet.pitotPressure, 
          outlet.size, 
          outlet.coefficient
        );
        
        return {
          outlet: index + 1,
          size: outlet.size,
          pitotPressure: outlet.pitotPressure,
          coefficient: outlet.coefficient || this.DEFAULT_COEFFICIENTS[outlet.size.toString()] || 0.85,
          flow: flow
        };
      } catch (error) {
        throw new Error(`Outlet ${index + 1}: ${error.message}`);
      }
    });

    const totalFlow = outletFlows.reduce((sum, outlet) => sum + outlet.flow, 0);

    return {
      totalFlow,
      outletFlows,
      outletCount: outlets.length
    };
  }

  /**
   * Calculate available fire flow at required residual pressure
   * Q_R = Q_F × (P_R/P_F)^0.54
   * 
   * @param {number} testFlow - Total flow during test (GPM)
   * @param {number} testResidualPressure - Residual pressure during test (PSI)
   * @param {number} requiredResidualPressure - Required residual pressure (typically 20 PSI)
   * @returns {number} Available fire flow at required residual pressure
   */
  calculateAvailableFireFlow(testFlow, testResidualPressure, requiredResidualPressure = 20) {
    if (!testFlow || !testResidualPressure) {
      throw new Error('Test flow and residual pressure are required');
    }
    
    if (testFlow <= 0 || testResidualPressure <= 0 || requiredResidualPressure <= 0) {
      throw new Error('Flow and pressure values must be positive');
    }

    // If test residual is less than required, flow exceeds available capacity
    if (testResidualPressure < requiredResidualPressure) {
      console.warn(
        `Test residual pressure (${testResidualPressure} PSI) is below required ` + 
        `residual pressure (${requiredResidualPressure} PSI)`
      );
    }

    // NFPA 291 available fire flow formula
    const availableFlow = testFlow * Math.pow(
      requiredResidualPressure / testResidualPressure, 
      0.54
    );

    return Math.round(availableFlow);
  }

  /**
   * Determine NFPA fire flow classification
   * 
   * @param {number} availableFireFlow - Available fire flow at 20 PSI residual
   * @returns {Object} Classification details
   */
  classifyFireFlow(availableFireFlow) {
    if (!availableFireFlow || availableFireFlow < 0) {
      throw new Error('Valid available fire flow is required');
    }

    let classification = 'C'; // Default to lowest class
    
    for (const [nfpaClass, thresholds] of Object.entries(this.NFPA_CLASSES)) {
      if (availableFireFlow >= thresholds.min && 
          (!thresholds.max || availableFireFlow <= thresholds.max)) {
        classification = nfpaClass;
        break;
      }
    }

    return {
      class: classification,
      description: this.getClassificationDescription(classification),
      color: this.NFPA_CLASSES[classification].color,
      flow: availableFireFlow,
      thresholds: this.NFPA_CLASSES[classification]
    };
  }

  /**
   * Get human-readable classification description
   */
  getClassificationDescription(nfpaClass) {
    const descriptions = {
      AA: 'Class AA: ≥1,500 GPM (Excellent fire protection)',
      A:  'Class A: 1,000-1,499 GPM (Good fire protection)', 
      B:  'Class B: 500-999 GPM (Adequate fire protection)',
      C:  'Class C: <500 GPM (Minimal fire protection)'
    };
    
    return descriptions[nfpaClass] || 'Unknown classification';
  }

  /**
   * Perform complete NFPA 291 flow test calculation
   * 
   * @param {Object} testData - Complete test data
   * @returns {Object} Complete calculation results
   */
  performFlowTest(testData) {
    const {
      staticPressure,
      residualPressure,
      outlets,
      requiredResidualPressure = 20
    } = testData;

    // Validate required data
    if (!staticPressure || !residualPressure || !outlets) {
      throw new Error('Static pressure, residual pressure, and outlets data are required');
    }

    try {
      // Calculate total flow from all outlets
      const flowResults = this.calculateTotalFlow(outlets);
      
      // Calculate available fire flow
      const availableFireFlow = this.calculateAvailableFireFlow(
        flowResults.totalFlow,
        residualPressure,
        requiredResidualPressure
      );
      
      // Determine NFPA classification
      const classification = this.classifyFireFlow(availableFireFlow);
      
      // Calculate pressure loss
      const pressureLoss = staticPressure - residualPressure;
      
      // Validation checks
      const validation = this.validateTestResults({
        staticPressure,
        residualPressure,
        totalFlow: flowResults.totalFlow,
        pressureLoss
      });

      return {
        // Input data
        testData: {
          staticPressure,
          residualPressure,
          requiredResidualPressure,
          outlets: flowResults.outletFlows
        },
        
        // Calculated results
        results: {
          totalFlow: flowResults.totalFlow,
          availableFireFlow,
          pressureLoss,
          classification,
          outletFlows: flowResults.outletFlows
        },
        
        // Quality control
        validation,
        
        // Metadata
        calculatedAt: new Date().toISOString(),
        nfpaStandard: '291',
        calculator: 'HydrantHub NFPA 291 Calculator v1.0'
      };
    } catch (error) {
      throw new Error(`Flow test calculation failed: ${error.message}`);
    }
  }

  /**
   * Validate test results for quality control
   */
  validateTestResults({ staticPressure, residualPressure, totalFlow, pressureLoss }) {
    const warnings = [];
    const errors = [];
    
    // Check pressure readings
    if (staticPressure < 20) {
      warnings.push('Static pressure is below 20 PSI - check system pressure');
    }
    
    if (residualPressure < 10) {
      warnings.push('Residual pressure is very low - may indicate system issues');
    }
    
    if (residualPressure >= staticPressure) {
      errors.push('Residual pressure cannot be greater than or equal to static pressure');
    }
    
    // Check flow rates
    if (totalFlow < 100) {
      warnings.push('Total flow is very low - check outlet conditions');
    }
    
    if (totalFlow > 5000) {
      warnings.push('Total flow is unusually high - verify measurements');
    }
    
    // Check pressure loss
    if (pressureLoss > staticPressure * 0.8) {
      warnings.push('Pressure loss is very high - may indicate restriction in system');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: this.calculateQualityScore(warnings.length, errors.length)
    };
  }

  /**
   * Calculate test quality score (0-100)
   */
  calculateQualityScore(warningCount, errorCount) {
    if (errorCount > 0) return 0;
    return Math.max(0, 100 - (warningCount * 15));
  }
}

module.exports = NFPA291Calculator;
