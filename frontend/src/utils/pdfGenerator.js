// PDF Generation Utilities for HydrantHub
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Generate NFPA 291 Flow Test PDF Report
export function generateFlowTestPDF(flowTest, hydrant) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPos = 30;

  // Header - HydrantHub branding
  doc.setFontSize(20);
  doc.setTextColor(30, 60, 114); // Dark blue
  doc.text('HydrantHub', margin, yPos);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('by Trident Systems', margin + 60, yPos);
  yPos += 20;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('NFPA 291 Fire Hydrant Flow Test Report', margin, yPos);
  yPos += 15;

  // Test Information
  doc.setFontSize(12);
  const testInfo = [
    ['Test Number:', flowTest.test_number || 'N/A'],
    ['Test Date:', new Date(flowTest.test_date).toLocaleDateString()],
    ['Hydrant Number:', hydrant?.hydrant_number || 'Unknown'],
    ['Location:', hydrant?.address || 'Not specified'],
    ['Organization:', flowTest.organization_name || 'Trident Systems']
  ];

  testInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 50, yPos);
    yPos += 8;
  });

  yPos += 10;

  // Test Results
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Results', margin, yPos);
  yPos += 10;

  const results = [
    ['Static Pressure:', `${flowTest.static_pressure_psi} PSI`],
    ['Residual Pressure:', `${flowTest.residual_pressure_psi} PSI`],
    ['Total Flow:', `${flowTest.total_flow_gpm} GPM`],
    ['Available Fire Flow:', `${flowTest.available_fire_flow_gpm} GPM`],
    ['NFPA Class:', flowTest.nfpa_class || 'N/A']
  ];

  doc.setFontSize(12);
  results.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 60, yPos);
    yPos += 8;
  });

  yPos += 15;

  // Outlets Table
  if (flowTest.outlets_data && flowTest.outlets_data.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Outlet Data', margin, yPos);
    yPos += 10;

    const tableData = flowTest.outlets_data.map((outlet, idx) => [
      `Outlet ${idx + 1}`,
      `${outlet.size}"`,
      `${outlet.pitotPressure} PSI`,
      outlet.coefficient || '0.9',
      `${outlet.flow_gpm || 'N/A'} GPM`
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Outlet', 'Size', 'Pitot Pressure', 'Coefficient', 'Flow']],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 60, 114], textColor: 255 }
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Notes
  if (flowTest.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(flowTest.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 6;
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, footerY);
  doc.text('https://app.tridentsys.ca', pageWidth - margin - 60, footerY);

  // Download
  const filename = `Flow_Test_${flowTest.test_number || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Hydrant Summary PDF
export function generateHydrantSummaryPDF(hydrants) {
  const doc = new jsPDF();
  const margin = 20;
  let yPos = 30;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 60, 114);
  doc.text('HydrantHub', margin, yPos);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('by Trident Systems', margin + 60, yPos);
  yPos += 20;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Hydrant Inventory Summary', margin, yPos);
  yPos += 20;

  // Summary stats
  const total = hydrants.length;
  const active = hydrants.filter(h => h.status === 'active').length;
  const byClass = hydrants.reduce((acc, h) => {
    acc[h.nfpa_class || 'Unknown'] = (acc[h.nfpa_class || 'Unknown'] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    ['Total Hydrants:', total.toString()],
    ['Active Hydrants:', active.toString()],
    ['Out of Service:', (total - active).toString()],
    ['Class AA:', (byClass.AA || 0).toString()],
    ['Class A:', (byClass.A || 0).toString()],
    ['Class B:', (byClass.B || 0).toString()],
    ['Class C:', (byClass.C || 0).toString()]
  ];

  doc.setFontSize(12);
  stats.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 60, yPos);
    yPos += 8;
  });

  yPos += 10;

  // Hydrants table
  const tableData = hydrants.slice(0, 20).map(h => [
    h.hydrant_number,
    h.address || 'No address',
    h.nfpa_class || 'N/A',
    h.available_flow_gpm || 'N/A',
    h.status || 'unknown'
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Number', 'Address', 'Class', 'Flow (GPM)', 'Status']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 60, 114], textColor: 255 }
  });

  // Footer
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, footerY);
  doc.text('https://app.tridentsys.ca', doc.internal.pageSize.width - margin - 60, footerY);

  // Download
  const filename = `Hydrant_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
