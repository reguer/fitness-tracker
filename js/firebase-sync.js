// Firebase opcional para GitHub Pages.
// Completa CONFIG.FIREBASE_CONFIG para activar login Google/email y Firestore.
window.FitFirebase = {
  ready: false,
  user: null,
  error: null,
  async init() {
    if (!hasFirebaseConfig()) return { ok: false, reason: 'missing-config' };
    try {
      const appMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const authMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
      const fsMod = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
      const app = appMod.initializeApp(CONFIG.FIREBASE_CONFIG);
      this.auth = authMod.getAuth(app);
      this.db = fsMod.getFirestore(app);
      this.authMod = authMod;
      this.fsMod = fsMod;
      this.ready = true;
      authMod.onAuthStateChanged(this.auth, user => {
        this.user = user;
        if (user) {
          migrateLocalDataToUser(user.uid);
          saveActiveUser({
            uid: user.uid,
            name: user.displayName || user.email || 'Usuario',
            email: user.email || '',
            provider: 'firebase'
          });
          this.loadUserData()
            .then(() => this.saveLocalSnapshot())
            .finally(() => { if (typeof renderAll === 'function') renderAll(); });
        }
      });
      return { ok: true };
    } catch (err) {
      this.error = err.message;
      console.warn('[FitTracker] Firebase init failed:', err.message);
      return { ok: false, reason: err.message };
    }
  },
  async signInGoogle() {
    if (!this.ready) await this.init();
    if (!this.ready) throw new Error('Firebase no configurado');
    const provider = new this.authMod.GoogleAuthProvider();
    return this.authMod.signInWithPopup(this.auth, provider);
  },
  async signInEmail(email, password) {
    if (!this.ready) await this.init();
    if (!this.ready) throw new Error('Firebase no configurado');
    return this.authMod.signInWithEmailAndPassword(this.auth, email, password);
  },
  async registerEmail(email, password) {
    if (!this.ready) await this.init();
    if (!this.ready) throw new Error('Firebase no configurado');
    return this.authMod.createUserWithEmailAndPassword(this.auth, email, password);
  },
  async signOut() {
    if (this.ready && this.auth) await this.authMod.signOut(this.auth);
    setStorageUserId('local');
    saveActiveUser({ uid: 'local', name: 'Local', email: '', provider: 'local' });
    if (typeof renderAll === 'function') renderAll();
  },
  async saveUserDoc(key, value) {
    if (!this.ready || !this.user || !this.db) return;
    let parts = ['users', this.user.uid, 'data', key];
    if (key === 'profile') parts = ['users', this.user.uid, 'profile', 'current'];
    if (key === 'program_settings') parts = ['users', this.user.uid, 'programSettings', 'current'];
    if (key === 'metrics') parts = ['users', this.user.uid, 'measurements', 'all'];
    if (key === 'biomarkers') parts = ['users', this.user.uid, 'biomarkers', 'all'];
    if (key === 'schedule_overrides' || key === 'program_overrides') parts = ['users', this.user.uid, 'programOverrides', key];
    if (key.indexOf('day_') === 0) parts = ['users', this.user.uid, 'logs', key.replace('day_', '')];
    if (key.indexOf('nutrition_') === 0) parts = ['users', this.user.uid, 'nutrition', key.replace('nutrition_', '')];
    const ref = this.fsMod.doc(this.db, ...parts);
    await this.fsMod.setDoc(ref, { value: value, updatedAt: new Date().toISOString() }, { merge: true });
  },
  async loadUserData() {
    if (!this.ready || !this.user || !this.db) return;
    const loadDoc = async (parts, key) => {
      const snap = await this.fsMod.getDoc(this.fsMod.doc(this.db, ...parts));
      if (snap.exists() && snap.data().value !== undefined) {
        localStorage.setItem(getScopedLSKey(key), JSON.stringify(snap.data().value));
      }
    };
    await Promise.all([
      loadDoc(['users', this.user.uid, 'profile', 'current'], 'profile'),
      loadDoc(['users', this.user.uid, 'programSettings', 'current'], 'program_settings'),
      loadDoc(['users', this.user.uid, 'measurements', 'all'], 'metrics'),
      loadDoc(['users', this.user.uid, 'biomarkers', 'all'], 'biomarkers'),
      loadDoc(['users', this.user.uid, 'programOverrides', 'schedule_overrides'], 'schedule_overrides'),
      loadDoc(['users', this.user.uid, 'programOverrides', 'program_overrides'], 'program_overrides')
    ]);
    const logs = await this.fsMod.getDocs(this.fsMod.collection(this.db, 'users', this.user.uid, 'logs'));
    logs.forEach(snap => {
      if (snap.data().value !== undefined) localStorage.setItem(getScopedLSKey('day_' + snap.id), JSON.stringify(snap.data().value));
    });
    const nutrition = await this.fsMod.getDocs(this.fsMod.collection(this.db, 'users', this.user.uid, 'nutrition'));
    nutrition.forEach(snap => {
      if (snap.data().value !== undefined) localStorage.setItem(getScopedLSKey('nutrition_' + snap.id), JSON.stringify(snap.data().value));
    });
  },
  async saveLocalSnapshot() {
    if (!this.ready || !this.user) return;
    const prefix = 'fittracker_u_' + this.user.uid + '_';
    const jobs = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf(prefix) !== 0) continue;
      const shortKey = k.slice(prefix.length);
      if (shortKey === 'active_user') continue;
      try { jobs.push(this.saveUserDoc(shortKey, JSON.parse(localStorage.getItem(k)))); }
      catch {}
    }
    await Promise.allSettled(jobs);
  }
};

window.FitFirebase.init();
