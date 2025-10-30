import React from 'react';

export default function Footer(){
  return (
    <footer style={{marginTop: 40, padding: 16, textAlign: 'center', borderTop: '1px solid #eee', color: '#555'}}>
      HydrantHub by <a href="https://tridentsys.ca" target="_blank" rel="noreferrer">Trident Systems</a> · <a href="mailto:support@tridentsys.ca">support@tridentsys.ca</a>
      <div style={{fontSize: 12, marginTop: 6}}>Serving Milton, Halton, Peel, GTA</div>
    </footer>
  );
}
