import { useState, useMemo, useEffect } from 'react';
import './App.css';
import motifsData from './data.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMotif, setSelectedMotif] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  // States for dynamic communes and settings
  const [departement, setDepartement] = useState('21'); // Default to Côte-d'Or
  const [communesList, setCommunesList] = useState([]);
  const [caserne, setCaserne] = useState('LIER');
  const [cta, setCta] = useState('ST03-CTA-21');

  // Form state for the ticket
  const [ticketData, setTicketData] = useState({
    numeroDepart: '',
    operateurCta: '',
    vehiculeAffiche: '',
    commune: '',
    voie: '',
    contact: '',
    observations: '',
    personnel: []
  });

  // Fetch communes when department changes
  useEffect(() => {
    if (!departement || departement.length < 2) return;
    
    // Auto-update CTA
    setCta(`ST03-CTA-${departement}`);

    fetch(`https://geo.api.gouv.fr/communes?codeDepartement=${departement}&fields=nom&format=json`)
      .then(res => res.json())
      .then(data => {
        const names = data.map(c => c.nom).sort();
        setCommunesList(names);
      })
      .catch(err => console.error("Erreur de chargement des communes:", err));
  }, [departement]);

  // Known Centres de Secours for dropdown
  const centres21 = [
    "LIERNAIS", "SAULIEU", "ARNAY-LE-DUC", "POUILLY-EN-AUXOIS", "NOLAY", "BEAUNE", 
    "PRECY-SOUS-THIL", "DIJON NORD", "DIJON SUD", "DIJON EST", "DIJON TRANSVAAL",
    "CHENOVE", "CHEVIGNY", "NUITS-ST-GEORGES", "MONTBARD", "CHATILLON-SUR-SEINE", 
    "AUXONNE", "GENLIS", "SEURRE", "ST-JEAN-DE-LOSNE", "IS-SUR-TILLE", "FONTAINE-FRANCAISE",
    "SOMBERNON", "VELARS-SUR-OUCHE", "VITTEAUX", "VENAREY-LES-LAUMES", "SEMUR-EN-AUXOIS",
    "RECEY-SUR-OURCE", "AIGNAY-LE-DUC", "BAIGNEUX-LES-JUIFS", "ST-SEINE-L'ABBAYE",
    "BLIGNY-SUR-OUCHE", "MIREBEAU-SUR-BEZE", "PONTAILLER", "SELONGEY", "SAULON"
  ];
  const centres71 = [
    "CHALON-SUR-SAONE", "MACON", "AUTUN", "LE CREUSOT", "MONTCEAU", "LOUHANS", "CHAROLLES", 
    "PARAY-LE-MONIAL", "DIGOIN", "GUEUGNON", "TOURNUS", "CLUNY", "CHAGNY"
  ];
  const centres58 = ["NEVERS", "CHATEAU-CHINON", "CLAMECY", "COSNE-SUR-LOIRE", "DECIZE", "LA CHARITE", "LUZY", "LORMES"];
  const centres89 = ["AUXERRE", "SENS", "JOIGNY", "AVALLON", "TONNERRE", "MIGENNES", "CHABLIS", "PONT-SUR-YONNE"];
  const centres10 = ["TROYES", "ROMILLY-SUR-SEINE", "BAR-SUR-AUBE", "BAR-SUR-SEINE", "NOGENT-SUR-SEINE"];
  const centres52 = ["CHAUMONT", "ST-DIZIER", "LANGRES", "JOINVILLE", "BOURBONNE-LES-BAINS"];
  const centres70 = ["VESOUL", "LURE", "GRAY", "LUXEUIL", "RIOZ", "MARNAY"];
  const centres39 = ["LONS-LE-SAUNIER", "DOLE", "ST-CLAUDE", "CHAMPAGNOLE", "POLIGNY", "ARBOIS", "SALINS-LES-BAINS"];

  let currentCentresList = [];
  switch(departement) {
    case '21': currentCentresList = centres21; break;
    case '71': currentCentresList = centres71; break;
    case '58': currentCentresList = centres58; break;
    case '89': currentCentresList = centres89; break;
    case '10': currentCentresList = centres10; break;
    case '52': currentCentresList = centres52; break;
    case '70': currentCentresList = centres70; break;
    case '39': currentCentresList = centres39; break;
    default: currentCentresList = [];
  }

  // Filter data based on search term
  const filteredMotifs = useMemo(() => {
    if (!searchTerm.trim()) return motifsData;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return motifsData.filter(item => 
      (item.motif && item.motif.toLowerCase().includes(lowercasedSearch)) ||
      (item.code && item.code.toLowerCase().includes(lowercasedSearch)) ||
      (item.vehicule && item.vehicule.toLowerCase().includes(lowercasedSearch)) ||
      (item.commune && item.commune.toLowerCase().includes(lowercasedSearch))
    );
  }, [searchTerm]);

  const handleCardClick = (motif) => {
    setSelectedMotif(motif);
    setIsValidated(false);
    
    // Determine default personnel rows based on vehicule type
    let defaultPersonnel = [];
    const veh = motif.vehicule ? motif.vehicule.toUpperCase() : '';
    
    if (veh.includes('VSAV')) {
      defaultPersonnel = [
        { engin: veh, fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'EQ 1', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'EQ 2', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (veh.includes('FPT') || veh.includes('CCR')) {
      defaultPersonnel = [
        { engin: veh, fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'CE', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'BAT', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'EQ', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'EQ', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else {
      defaultPersonnel = [
        { engin: veh, fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: veh, fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' }
      ];
    }

    // Generate a random 6 digit number for the departure
    const randomNum = Math.floor(100000 + Math.random() * 900000);

    setTicketData({
      numeroDepart: `${randomNum}-01-${caserne}`,
      operateurCta: cta,
      vehiculeAffiche: motif.vehicule || 'SANS VEHICULE',
      commune: motif.commune || '',
      voie: '',
      contact: '',
      observations: '',
      personnel: defaultPersonnel
    });
  };

  const handleCloseModal = () => {
    setSelectedMotif(null);
    setTimeout(() => setIsValidated(false), 300);
  };

  const handleValidate = () => {
    setIsValidated(true);
    setTimeout(() => {
      handleCloseModal();
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const updatePersonnel = (index, field, value) => {
    const newPersonnel = [...ticketData.personnel];
    newPersonnel[index][field] = value;
    setTicketData({ ...ticketData, personnel: newPersonnel });
  };

  const addPersonnelRow = () => {
    setTicketData({
      ...ticketData,
      personnel: [
        ...ticketData.personnel,
        { engin: selectedMotif.vehicule || '', fonction: '', nom: '', matricule: '', bip: '', gr: '' }
      ]
    });
  };

  const addVehicle = (typeVehicule) => {
    let newRows = [];
    if (typeVehicule === 'VSAV') {
      newRows = [
        { engin: 'VSAV ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSAV ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSAV ', fonction: 'EQ 1', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSAV ', fonction: 'EQ 2', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'VSAV3') {
      newRows = [
        { engin: 'VSAV ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSAV ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSAV ', fonction: 'EQ', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'FPT') {
      newRows = [
        { engin: 'FPT ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'FPT ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'FPT ', fonction: 'CE', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'FPT ', fonction: 'BAT', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'FPT ', fonction: 'EQ 1', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'FPT ', fonction: 'EQ 2', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'SR') {
      newRows = [
        { engin: 'VSR ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSR ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VSR ', fonction: 'EQ', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'VTU') {
      newRows = [
        { engin: 'VTU ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'VTU ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'VLCG') {
      newRows = [
        { engin: 'VLCG ', fonction: 'COS', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'CCF') {
      newRows = [
        { engin: 'CCF ', fonction: 'CC', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'CCF ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'CCF ', fonction: 'EQ 1', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'CCF ', fonction: 'EQ 2', nom: '', matricule: '', bip: '', gr: '' },
      ];
    } else if (typeVehicule === 'EPA') {
      newRows = [
        { engin: 'EPA ', fonction: 'CA', nom: '', matricule: '', bip: '', gr: '' },
        { engin: 'EPA ', fonction: 'COND', nom: '', matricule: '', bip: '', gr: '' },
      ];
    }

    setTicketData({
      ...ticketData,
      personnel: [...ticketData.personnel, ...newRows],
      vehiculeAffiche: ticketData.vehiculeAffiche !== 'SANS VEHICULE' && ticketData.vehiculeAffiche !== '' 
        ? `${ticketData.vehiculeAffiche} + ${newRows[0]?.engin.trim()}`
        : newRows[0]?.engin.trim()
    });
  };

  const removePersonnelRow = (index) => {
    const newPersonnel = ticketData.personnel.filter((_, i) => i !== index);
    setTicketData({ ...ticketData, personnel: newPersonnel });
  };

  const [voiesList, setVoiesList] = useState([
    "Rue ", "Avenue ", "Boulevard ", "Impasse ", "Allée ", "Route ", "Chemin ", "Place ", "Lieu-dit "
  ]);

  // Fetch streets dynamically when commune or voie changes
  useEffect(() => {
    if (!ticketData.commune) return;
    
    // We delay the fetch slightly to avoid spamming the API while typing
    const timeoutId = setTimeout(() => {
      const query = ticketData.voie ? `${ticketData.voie} ${ticketData.commune}` : ticketData.commune;
      
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=street&limit=15`)
        .then(res => res.json())
        .then(data => {
          if (data && data.features && data.features.length > 0) {
            const streets = data.features.map(f => f.properties.name);
            setVoiesList([...new Set(streets)]);
          }
        })
        .catch(err => console.error("Erreur de chargement des voies:", err));
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [ticketData.commune, ticketData.voie]);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR') + ' ' + now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      {/* Hidden Datalists for dropdowns */}
      <datalist id="centres-list">
        {currentCentresList.map((c, i) => <option key={i} value={c} />)}
      </datalist>
      <datalist id="communes-list">
        {communesList.map((c, i) => <option key={i} value={c} />)}
      </datalist>
      <datalist id="voies-list">
        {voiesList.map((v, i) => <option key={i} value={v} />)}
      </datalist>
      <datalist id="contacts-list">
        <option value="Appelant" />
        <option value="Gendarmerie" />
        <option value="Police" />
        <option value="SAMU" />
        <option value="Mairie" />
        <option value="Enedis" />
        <option value="GRDF" />
      </datalist>

      <header className="header no-print">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Dpt :</span>
            <input 
              type="text" 
              maxLength="3"
              style={{ width: '40px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none' }}
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Centre :</span>
            <input 
              type="text" 
              list="centres-list"
              style={{ width: '100px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none', textTransform: 'uppercase' }}
              value={caserne}
              onChange={(e) => setCaserne(e.target.value.toUpperCase())}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-color)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>CTA :</span>
            <input 
              type="text" 
              style={{ width: '120px', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none', textTransform: 'uppercase' }}
              value={cta}
              onChange={(e) => setCta(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <h1>Générateur d'Ordre de Départ</h1>
        <p>Annuaire des motifs de départ (OD)</p>
      </header>

      <div className="search-container no-print">
        <input 
          type="text" 
          className="search-input" 
          placeholder="Rechercher par motif, code, véhicule ou commune..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid-container no-print">
        {filteredMotifs.length > 0 ? (
          filteredMotifs.map((item, index) => (
            <div 
              className="card" 
              key={index}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleCardClick(item)}
            >
              <div className="card-header">
                {item.code ? <span className="code-badge">{item.code}</span> : <span></span>}
                {item.vehicule && <span className="vehicule-badge">{item.vehicule}</span>}
              </div>
              <h2 className="card-title">{item.motif || 'Motif non précisé'}</h2>
            </div>
          ))
        ) : (
          <div className="no-results">
            Aucun motif trouvé pour "{searchTerm}"
          </div>
        )}
      </div>

      {/* Modal / Ticket Validation */}
      {selectedMotif && (
        <div className="modal-overlay">
          <div className="modal-content printable-ticket" onClick={(e) => e.stopPropagation()}>
            {!isValidated ? (
              <>
                {/* Header of the Printable Ticket */}
                <div className="ticket-print-header">
                  <div className="ticket-print-left">
                    <div className="ticket-print-box">DEPART STANDARD</div>
                    <div className="ticket-print-box">{getCurrentDate()}</div>
                    
                    <input 
                      type="text" 
                      className="ticket-header-input"
                      style={{ marginTop: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem', background: 'transparent', border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit' }}
                      value={ticketData.numeroDepart}
                      onChange={(e) => setTicketData({...ticketData, numeroDepart: e.target.value})}
                    />

                    <div className="ticket-print-row">
                      <span>Rang : 1</span>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <span>traité par : </span>
                        <input 
                          type="text" 
                          className="ticket-header-input"
                          style={{ marginLeft: '0.5rem', width: '150px', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '1rem' }}
                          value={ticketData.operateurCta}
                          onChange={(e) => setTicketData({...ticketData, operateurCta: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="ticket-print-right">
                    <input 
                      type="text" 
                      className="ticket-vehicule-big" 
                      style={{ background: 'transparent', border: 'none', color: 'inherit', font: 'inherit', width: '100%', textAlign: 'right', outline: 'none' }}
                      value={ticketData.vehiculeAffiche}
                      onChange={(e) => setTicketData({...ticketData, vehiculeAffiche: e.target.value})}
                    />
                  </div>
                </div>

                <div className="ticket-sinistre">
                  <strong>sinistre :</strong> {selectedMotif.motif} {selectedMotif.code && `(${selectedMotif.code})`}
                </div>

                <h3 className="section-title">Localisation du sinistre</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Commune</label>
                    <input 
                      type="text" 
                      list="communes-list"
                      value={ticketData.commune} 
                      onChange={(e) => setTicketData({...ticketData, commune: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Voie</label>
                    <input 
                      type="text" 
                      list="voies-list"
                      value={ticketData.voie} 
                      onChange={(e) => setTicketData({...ticketData, voie: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact</label>
                    <input 
                      type="text" 
                      list="contacts-list"
                      value={ticketData.contact} 
                      onChange={(e) => setTicketData({...ticketData, contact: e.target.value})} 
                    />
                  </div>
                </div>

                <h3 className="section-title">Observations</h3>
                <textarea 
                  className="observations-input" 
                  rows="2"
                  value={ticketData.observations}
                  onChange={(e) => setTicketData({...ticketData, observations: e.target.value})}
                ></textarea>

                <div className="section-header-flex">
                  <h3 className="section-title">ARMEMENT DU VEHICULE</h3>
                  <div style={{display: 'flex', gap: '0.5rem'}} className="no-print">
                    <select 
                      className="btn-small" 
                      style={{background: 'var(--surface-color)', color: 'white', border: '1px solid var(--border-color)', outline: 'none', cursor: 'pointer'}}
                      onChange={(e) => {
                        if(e.target.value) {
                          addVehicle(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">+ Ajouter un Engin</option>
                      <option value="VSAV">VSAV (4 pers)</option>
                      <option value="VSAV3">VSAV (3 pers)</option>
                      <option value="FPT">FPT / CCR (6 pers)</option>
                      <option value="SR">VSR / SR (3 pers)</option>
                      <option value="VTU">VTU / VID (2 pers)</option>
                      <option value="VLCG">VLCG / VL (1 pers)</option>
                      <option value="CCF">CCF (4 pers)</option>
                      <option value="EPA">EPA / MEA (2 pers)</option>
                    </select>
                    <button className="btn-small" onClick={addPersonnelRow}>+ 1 Ligne</button>
                  </div>
                </div>
                
                <div className="table-responsive">
                  <table className="personnel-table">
                    <thead>
                      <tr>
                        <th>ENGINS</th>
                        <th>FCT</th>
                        <th>NOM</th>
                        <th>MATRICULE</th>
                        <th>BIP</th>
                        <th>GR</th>
                        <th className="no-print"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketData.personnel.map((p, index) => (
                        <tr key={index}>
                          <td><input type="text" value={p.engin} onChange={(e) => updatePersonnel(index, 'engin', e.target.value)} /></td>
                          <td><input type="text" value={p.fonction} onChange={(e) => updatePersonnel(index, 'fonction', e.target.value)} /></td>
                          <td><input type="text" value={p.nom} onChange={(e) => updatePersonnel(index, 'nom', e.target.value)} /></td>
                          <td><input type="text" value={p.matricule} onChange={(e) => updatePersonnel(index, 'matricule', e.target.value)} /></td>
                          <td><input type="text" value={p.bip} onChange={(e) => updatePersonnel(index, 'bip', e.target.value)} /></td>
                          <td><input type="text" value={p.gr} onChange={(e) => updatePersonnel(index, 'gr', e.target.value)} /></td>
                          <td className="no-print">
                            <button className="btn-delete" onClick={() => removePersonnelRow(index)}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="modal-actions no-print" style={{ marginTop: '2rem' }}>
                  <button className="btn btn-cancel" onClick={handleCloseModal}>
                    Fermer
                  </button>
                  <button className="btn btn-print" onClick={handlePrint}>
                    🖨️ Imprimer
                  </button>
                  <button className="btn btn-confirm" onClick={handleValidate}>
                    ✓ Valider le départ
                  </button>
                </div>
              </>
            ) : (
              <div className="success-message no-print">
                <span className="success-icon">✅</span>
                <h2>Ordre Envoyé !</h2>
                <p>Les véhicules sont en route pour le motif {selectedMotif.code}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
