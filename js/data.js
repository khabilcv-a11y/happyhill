/* Sample data for the prototype. Replaced by the Google Sheets API in the next phase. */
(function () {
  const DAY = 864e5;
  const off = n => { const d = new Date(); d.setHours(0, 0, 0, 0); return new Date(d.getTime() + n * DAY).toISOString().slice(0, 10); };

  const colleges = [1, 2, 3, 4, 5].map(i => ({
    id: 'C' + i, name: 'Partner College ' + i, coordinator: 'Coordinator ' + i,
    phone: '', email: 'coordinator' + i + '@example.org', homeId: 'H' + i, target: 4
  }));
  const homes = [1, 2, 3, 4, 5].map(i => ({
    id: 'H' + i, name: 'Welfare Home ' + i, head: 'Superintendent ' + i,
    phone: '', email: 'home' + i + '@example.org', collegeId: 'C' + i
  }));

  const titles = [
    ['Psychosocial support session', 'Group counselling and social skills circle with residents.'],
    ['Vocational training: envelope making', 'Hands-on training for self-employment, with material support.'],
    ['Life skills workshop', 'Personal hygiene, money handling and daily-living skills.'],
    ['Cultural evening', 'Music, dance and storytelling led by students and residents.'],
    ['Recreation day', 'Indoor and outdoor games, and a shared meal.'],
    ['Health awareness camp', 'Basic health check-up and awareness talk with local clinic.'],
    ['Marketing guidance for products', 'Pricing, packaging and selling the residents’ products.'],
    ['Infrastructure assessment visit', 'Walk-through to list repair and upgrade needs.']
  ];
  // [title index, day offset, status, workflow]
  const pattern = [
    [1, -48, 'Completed', 'Verified'], [0, -34, 'Completed', 'Verified'], [2, -20, 'Completed', 'Verified'],
    [3, -11, 'Completed', 'Submitted'], [5, -5, 'Planned', 'Draft'], [4, -1, 'Ongoing', 'Draft'],
    [6, 6, 'Planned', 'Draft'], [7, 19, 'Planned', 'Draft']
  ];
  const activities = [];
  colleges.forEach((c, ci) => {
    pattern.forEach((p, pi) => {
      if (ci === 4 && pi > 5) return;           // keep some variety between colleges
      if (ci === 2 && pi === 4) p = [4, -9, 'Planned', 'Draft'];
      const shift = (ci * 3) % 7;
      const planned = off(p[1] + shift - 3);
      const done = p[2] === 'Completed';
      activities.push({
        id: 'A' + (activities.length + 1), title: titles[p[0]][0], desc: titles[p[0]][1],
        collegeId: c.id, homeId: c.homeId, planned, actual: done ? planned : '',
        status: p[2], wf: p[3], coordinator: c.coordinator,
        outcome: done ? 'Held as planned; good participation from residents.' : '',
        evidence: done ? 'https://drive.google.com/' : '', challenges: '', nextAction: '',
        followUp: false, updatedBy: c.coordinator, updatedAt: off(p[1] + shift - 2),
        history: [{ t: off(p[1] + shift - 5), by: c.coordinator, text: 'Activity created' }]
          .concat(done ? [{ t: planned, by: c.coordinator, text: 'Marked Completed' }] : [])
          .concat(p[3] === 'Verified' ? [{ t: off(p[1] + shift + 1), by: 'Admin', text: 'Verified' }] : [])
      });
    });
  });

  const followups = [
    { id: 'F1', activityId: 'A5', reason: 'Resource person unavailable on the planned date', action: 'Reschedule with the home superintendent', owner: 'Coordinator 1', due: off(5), done: false },
    { id: 'F2', activityId: 'A13', reason: 'Material not delivered', action: 'Arrange material and confirm a new date', owner: 'Coordinator 2', due: off(2), done: false }
  ];

  const mous = colleges.map((c, i) => ({
    id: 'M' + (i + 1), collegeId: c.id, homeId: c.homeId,
    start: off(-300 + i * 20), end: off([30, 420, 200, -10, 55][i]), renewal: ['Renewal requested', '', '', 'Lapsed - to be renewed', 'Under review'][i]
  }));
  const reviews = [
    { id: 'R1', collegeId: 'C1', date: off(-30), quarter: 'Q-1', minutes: 'Reviewed activity plan; agreed on four activities per month.', actions: 'Submit evidence links within 3 days of each activity.' },
    { id: 'R2', collegeId: 'C2', date: off(12), quarter: 'Q-1', minutes: '', actions: '' },
    { id: 'R3', collegeId: 'C4', date: off(25), quarter: 'Q-1', minutes: '', actions: '' }
  ];
  const resources = [
    { id: 'D1', title: 'Activity report template', kind: 'Template', url: '#' },
    { id: 'D2', title: 'Project guidelines for partner colleges', kind: 'Guideline', url: '#' },
    { id: 'D3', title: 'IEC materials folder', kind: 'IEC', url: '#' },
    { id: 'D4', title: 'MoU format', kind: 'Template', url: '#' }
  ];

  const iso = n => new Date(Date.now() + n * 36e5).toISOString();
  const requests = [
    { id: 'Q1', collegeId: 'C1', homeId: 'H1', type: 'Material', title: 'Envelope-making material running low', details: 'The vocational group has used most of the paper and glue. We need a fresh stock to continue the envelope-making sessions.', specifics: '200 envelopes worth of paper, 4 glue bottles', priority: 'Urgent', neededBy: off(6), activityId: '', status: 'In progress', raisedBy: 'Superintendent 1', raisedRole: 'home', createdAt: iso(-70), updatedAt: iso(-20), closedBy: '', closedAt: '', closeNote: '' },
    { id: 'Q2', collegeId: 'C2', homeId: 'H2', type: 'Session', title: 'Counselling session for the evening group', details: 'We would like one more counselling session this month, ideally in the evening after tea.', specifics: 'Group counselling, resource person from the college', priority: 'Normal', neededBy: off(14), activityId: '', status: 'Open', raisedBy: 'Superintendent 2', raisedRole: 'home', createdAt: iso(-30), updatedAt: iso(-30), closedBy: '', closedAt: '', closeNote: '' },
    { id: 'Q3', collegeId: 'C1', homeId: 'H1', type: 'Intervention', title: 'Leaking roof in the activity room', details: 'Water enters the activity room during rain, so sessions have been moved to the verandah.', specifics: 'Maintenance team / PWD', priority: 'Urgent', neededBy: '', activityId: '', status: 'Closed', raisedBy: 'Coordinator 1', raisedRole: 'college', createdAt: iso(-300), updatedAt: iso(-120), closedBy: 'DCIP Intern', closedAt: iso(-120), closeNote: 'Repair completed by the maintenance team on site.' }
  ];
  const messages = [
    { id: 'G1', requestId: 'Q1', by: 'Coordinator 1', role: 'college', at: iso(-60), kind: 'message', text: 'Noted. We will bring the paper and glue with us on our next visit.' },
    { id: 'G2', requestId: 'Q1', by: 'Coordinator 1', role: 'college', at: iso(-20), kind: 'status', text: 'marked it in progress' },
    { id: 'G3', requestId: 'Q3', by: 'DCIP Intern', role: 'admin', at: iso(-250), kind: 'message', text: 'Forwarded to the District office. Will update soon.' },
    { id: 'G4', requestId: 'Q3', by: 'DCIP Intern', role: 'admin', at: iso(-120), kind: 'status', text: 'closed the request: Repair completed by the maintenance team on site.' }
  ];
  const users = [
    { id: 'U1', name: 'Super Admin', email: 'superadmin@example.org', role: 'superadmin', active: true },
    { id: 'U2', name: 'DCIP Intern', email: 'admin@example.org', role: 'admin', active: true },
    { id: 'U3', name: 'District Officer', email: 'district@example.org', role: 'district', active: true },
    { id: 'U4', name: 'Coordinator 1', email: 'coordinator1@example.org', role: 'college', collegeId: 'C1', active: true },
    { id: 'U5', name: 'Coordinator 2', email: 'coordinator2@example.org', role: 'college', collegeId: 'C2', active: true },
    { id: 'U6', name: 'Superintendent 1', email: 'home1@example.org', role: 'home', homeId: 'H1', active: true }
  ];
  const logs = [
    { t: new Date(Date.now() - 36e5 * 5).toISOString(), user: 'DCIP Intern', role: 'admin', action: 'Verified activity', detail: 'A2 Psychosocial support session' },
    { t: new Date(Date.now() - 36e5 * 3).toISOString(), user: 'Coordinator 1', role: 'college', action: 'Submitted activity', detail: 'A4 Cultural evening' }
  ];

  window.SEED = { colleges, homes, activities, followups, mous, reviews, resources, requests, messages, users, logs, settings: { monthlyTarget: 4, updateDeadlineDays: 3 } };
})();
