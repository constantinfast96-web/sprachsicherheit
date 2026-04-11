/*
  Dieses Skript implementiert die Logik für die statische GitHub‑Pages‑Umfrage.
  Es verbindet sich mit der Firebase Realtime Database, um Stimmen zu speichern
  und die Ergebnisse in Echtzeit zu aktualisieren. Jede Stimmabgabe erhöht
  atomar den jeweiligen Zähler mit ServerValue.increment(), was gleichzeitige
  Zugriffe zuverlässig zusammenführt【203927408579846†L18-L30】.

  Um die Umfrage zu betreiben, müssen Sie das firebaseConfig‑Objekt mit
  Ihren eigenen Projektinformationen aus der Firebase-Konsole ausfüllen. Achten
  Sie darauf, in den Firebase‑Security‑Rules Schreibzugriff nur auf den
  gewünschten Datenpfad zu gewähren (z.B. read/write: true oder domain‑
  basierte Regeln). Danach können Sie die Dateien in ein GitHub‑Repository
  hochladen und GitHub Pages aktivieren.
*/

(() => {
  // TODO: Ersetzen Sie die Platzhalter durch Ihre Firebase-Projektkonfiguration
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  };
  // Initialisieren Sie Firebase nur, wenn die Konfigurationsdaten vorhanden sind
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.warn('Firebase konnte nicht initialisiert werden. Bitte fügen Sie Ihre Konfiguration in firebaseConfig ein.');
  }
  // Verweise auf DOM‑Elemente
  const chartEl = document.getElementById('chart');
  const form = document.getElementById('voteForm');
  const submitBtn = document.getElementById('submitBtn');

  /**
   * Aktualisiert das Balkendiagramm anhand der aktuellen Stimmen. Die Breite
   * jeder Leiste entspricht dem Verhältnis der jeweiligen Option zur Gesamtzahl
   * der Stimmen. Die Funktion wird bei jedem Datenupdate aus Firebase aufgerufen.
   *
   * @param {Object} counts Objekt mit Schlüssel A–D und Zahlenwerten
   */
  function updateChart(counts) {
    const total = (counts.A || 0) + (counts.B || 0) + (counts.C || 0) + (counts.D || 0);
    if (total > 0) {
      chartEl.style.display = 'block';
    }
    ['A', 'B', 'C', 'D'].forEach((opt) => {
      const bar = document.getElementById(`bar${opt}`);
      const countEl = document.getElementById(`count${opt}`);
      const count = counts[opt] || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      bar.style.width = `${percentage}%`;
      countEl.textContent = count;
    });
  }

  // Nur weiterarbeiten, wenn Firebase initialisiert wurde
  if (firebase.apps && firebase.apps.length) {
    const db = firebase.database();
    // Pfad für die Umfrage (kann angepasst werden)
    const votesRef = db.ref('surveys/confidenceVotes');
    // Listener: aktualisiert das Diagramm bei Datenänderungen
    votesRef.on('value', (snapshot) => {
      const data = snapshot.val() || {};
      updateChart(data);
    });
    // Formular verarbeiten
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const option = formData.get('answer');
      if (!option) return;
      // Atomares Inkrement der ausgewählten Option
      const updates = {};
      updates[option] = firebase.database.ServerValue.increment(1);
      votesRef.update(updates)
        .then(() => {
          // Felder deaktivieren, nachdem Stimme erfolgreich gespeichert wurde
          submitBtn.disabled = true;
          form.querySelectorAll('input[name="answer"]').forEach((el) => {
            el.disabled = true;
          });
        })
        .catch((err) => {
          console.error('Fehler beim Speichern der Stimme:', err);
          alert('Beim Speichern Ihrer Stimme ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.');
        });
    });
  }
})();