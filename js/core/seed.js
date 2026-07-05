// ============================================================
// WRO Philippines DBMS – Demo Data Seeder
// Pre-populates with realistic Philippines WRO data
// ============================================================

const Seeder = {

  PH_REGIONS: [
    'NCR – National Capital Region',
    'Region I – Ilocos Region',
    'Region II – Cagayan Valley',
    'Region III – Central Luzon',
    'Region IV-A – CALABARZON',
    'Region IV-B – MIMAROPA',
    'Region V – Bicol Region',
    'Region VI – Western Visayas',
    'Region VII – Central Visayas',
    'Region VIII – Eastern Visayas',
    'Region IX – Zamboanga Peninsula',
    'Region X – Northern Mindanao',
    'Region XI – Davao Region',
    'Region XII – SOCCSKSARGEN',
    'Region XIII – Caraga',
    'BARMM – Bangsamoro',
    'CAR – Cordillera Administrative Region',
  ],

  PROVINCES: {
    'NCR – National Capital Region': ['Metro Manila'],
    'Region III – Central Luzon': ['Bulacan','Pampanga','Nueva Ecija','Tarlac','Bataan','Zambales','Aurora'],
    'Region IV-A – CALABARZON': ['Laguna','Cavite','Batangas','Rizal','Quezon'],
    'Region VII – Central Visayas': ['Cebu','Bohol','Negros Oriental','Siquijor'],
    'Region XI – Davao Region': ['Davao del Sur','Davao del Norte','Davao Oriental','Davao Occidental','Davao de Oro'],
  },

  CITIES: {
    'Metro Manila': ['Makati','Taguig','Pasig','Quezon City','Manila','Mandaluyong','Marikina','Muntinlupa','Las Piñas','Parañaque','Pasay','Valenzuela','Caloocan','Malabon','Navotas','Pateros','San Juan'],
    'Bulacan': ['Malolos','Meycauayan','San Jose del Monte','Obando','Sta. Maria'],
    'Pampanga': ['San Fernando','Angeles','Mabalacat','Porac'],
    'Laguna': ['Santa Rosa','Biñan','San Pedro','Calamba','Los Baños'],
    'Cebu': ['Cebu City','Mandaue','Lapu-Lapu','Talisay','Danao'],
    'Davao del Sur': ['Davao City','Digos'],
  },

  SCHOOL_NAMES: [
    'Philippine Science High School', 'Ateneo de Manila University',
    'De La Salle University', 'University of Santo Tomas',
    'Far Eastern University', 'Mapua University',
    'Adamson University', 'Technological Institute of the Philippines',
    'Jose Rizal University', 'Centro Escolar University',
    'Saint Jude Catholic School', 'Don Bosco Technical College',
    'Holy Cross of Davao College', 'University of San Carlos',
    'Cebu Institute of Technology', 'Xavier University',
    'Mindanao State University', 'Western Mindanao State University',
    'Laguna College of Business and Arts', 'Lipa City Colleges',
    'STI College', 'AMA Computer College',
    'National University', 'San Beda University',
    'Letran College', 'Assumption College',
    'Miriam College', 'Holy Spirit of Manila',
    'La Salle Green Hills', 'Colegio de San Juan de Letran',
    'Emilio Aguinaldo College', 'Our Lady of Fatima University',
    'Bulacan State University', 'Batangas State University',
    'Tarlac State University', 'Nueva Ecija University',
    'Pampanga State Agricultural University', 'Cavite State University',
  ],

  COACH_FIRST_NAMES: ['Maria','Juan','Jose','Ana','Carlos','Rosa','Eduardo','Liza','Roberto','Gloria','Miguel','Cynthia','Ramon','Patricia','Antonio','Marisol','Fernando','Cristina','Rodrigo','Rowena'],
  COACH_LAST_NAMES:  ['Santos','Reyes','Cruz','Bautista','Ocampo','Garcia','Mendoza','Torres','Aquino','Ramos','Dela Cruz','Villanueva','Fernandez','Gonzales','Castro','Flores','Diaz','Morales','Aguilar','Pascual'],

  STUDENT_FIRST_NAMES: ['Aiden','Sofia','Liam','Emma','Noah','Olivia','Lucas','Ava','Ethan','Isabella','Mason','Mia','Logan','Charlotte','Oliver','Amelia','Elijah','Harper','James','Evelyn','Mateo','Aria','Sebastian','Luna','Jack','Chloe'],
  STUDENT_LAST_NAMES:  ['Santos','Reyes','Cruz','Bautista','Ocampo','Garcia','Mendoza','Torres','Aquino','Ramos','Villanueva','Fernandez','Gonzales','Castro','Flores','Diaz','Morales','Aguilar','Pascual','Soriano'],

  TEAM_NAMES: ['Team Alpha','Team Omega','Team Phoenix','Team Vanguard','Team Nexus','RoboElite','TechWizards','BrainBots','InnovatorsX','CircuitBreakers','ByteForce','QuantumLeap','NanoMinds','TechnoKids','RoboStars','FutureBots','MindBenders','CodeCrushers','RoboSapiens','Techsmiths'],

  WRO_CATEGORIES: [
    'RoboMission – Elementary', 'RoboMission – Junior', 'RoboMission – Senior',
    'Future Engineers', 'Future Innovators',
    'RoboSports', 'WeDo', 'Advanced Robotics',
  ],

  SEASONS: ['WRO 2022','WRO 2023','WRO 2024','WRO 2025'],

  ROBOT_PLATFORMS: ['LEGO Mindstorms EV3','LEGO Mindstorms NXT','LEGO SPIKE Prime','Arduino','Raspberry Pi','VEX IQ','LEGO SPIKE Essential','Custom Build'],

  PROGRAMMING_LANGUAGES: ['LEGO Mindstorms Software','SPIKE App','Scratch','Python','C++','Arduino IDE','EV3 Classroom','Blockly'],

  VENUES: [
    'SMX Convention Center, Manila', 'World Trade Center, Pasay',
    'Marriott Grand Ballroom, Pasay', 'University of Santo Tomas, Manila',
    'Philippine International Convention Center', 'PICC Forum, Pasay',
    'Cebu International Convention Center', 'Davao Convention Center',
  ],

  AWARDS_LIST: ['Champion','1st Runner-up','2nd Runner-up','Best Robot Design','Best Programming','Best Teamwork','Best Presentation','Most Creative','Best Rookie Team','Special Award','Certificate of Participation'],

  PAYMENT_METHODS: ['Bank Transfer','GCash','Maya','Cash','Check','Online Payment'],

  /** Seed all demo data */
  run() {
    if (DB.isSeeded()) return;

    console.log('[Seeder] Starting database seed...');

    // ── 1. Default Users ──────────────────────────────────
    const users = [
      { id: 'USER_SUPERADMIN', username: 'admin',     password: 'admin123',     name: 'Lawrence Francisco',  role: 'SUPER_ADMIN',   email: 'admin@wrophilippines.org',    isActive: true },
      { id: 'USER_EVENTADMIN', username: 'eventadmin',password: 'event123',     name: 'Maria Santos',        role: 'EVENT_ADMIN',   email: 'event@wrophilippines.org',    isActive: true },
      { id: 'USER_JUDGE1',     username: 'judge1',    password: 'judge123',     name: 'Dr. Jose Reyes',      role: 'JUDGE',         email: 'judge1@wrophilippines.org',   isActive: true },
      { id: 'USER_COACH1',     username: 'coach1',    password: 'coach123',     name: 'Carlos Mendoza',      role: 'COACH',         email: 'coach1@gmail.com',            isActive: true },
      { id: 'USER_VOLUNTEER1', username: 'volunteer1',password: 'volunteer123', name: 'Ana Garcia',          role: 'VOLUNTEER',     email: 'volunteer1@gmail.com',        isActive: true },
    ];
    users.forEach(u => DB.insert('users', u));

    // ── 2. Schools ────────────────────────────────────────
    const schoolIds = [];
    const schoolTypes = ['Private','Public','Sectarian'];
    const schoolLevels = ['Elementary','High School','Senior High School','College','K-12'];
    const regCount = { 'NCR – National Capital Region': 10, 'Region IV-A – CALABARZON': 6, 'Region VII – Central Visayas': 5, 'Region XI – Davao Region': 4, 'Region III – Central Luzon': 5 };

    let schoolIdx = 0;
    Object.entries(regCount).forEach(([region, count]) => {
      for (let i = 0; i < count; i++) {
        const province = this.PROVINCES[region]?.[0] || 'Metro Manila';
        const cityList = this.CITIES[province] || ['City'];
        const city = cityList[i % cityList.length];
        const schoolName = this.SCHOOL_NAMES[schoolIdx % this.SCHOOL_NAMES.length];
        schoolIdx++;
        const s = DB.insert('schools', {
          id: `SCH_${String(schoolIdx).padStart(3,'0')}`,
          schoolName,
          schoolType:  Utils.randomChoice(schoolTypes),
          schoolLevel: Utils.randomChoice(schoolLevels),
          depedId:     `DEP${Utils.randomInt(100000,999999)}`,
          region, province, city,
          address:     `${Utils.randomInt(1,999)} ${Utils.randomChoice(['Rizal Ave','Mabini St','Quezon Blvd','JP Laurel St','Roxas Blvd'])}, ${city}`,
          contactNumber: `02-${Utils.randomInt(1000,9999)}-${Utils.randomInt(1000,9999)}`,
          email:        `office@${Utils.slugify(schoolName)}.edu.ph`,
          schoolHead:   `${Utils.randomChoice(this.COACH_FIRST_NAMES)} ${Utils.randomChoice(this.COACH_LAST_NAMES)}`,
          roboticsCoordinator: `${Utils.randomChoice(this.COACH_FIRST_NAMES)} ${Utils.randomChoice(this.COACH_LAST_NAMES)}`,
          yearsJoined: Utils.randomInt(2018, 2024),
          status: 'active',
        });
        schoolIds.push(s.id);
      }
    });

    // ── 3. Coaches ────────────────────────────────────────
    const coachIds = [];
    schoolIds.forEach((schoolId, idx) => {
      const genders = ['Male','Female'];
      const gender  = Utils.randomChoice(genders);
      const first   = this.COACH_FIRST_NAMES[idx % this.COACH_FIRST_NAMES.length];
      const last    = this.COACH_LAST_NAMES[idx % this.COACH_LAST_NAMES.length];
      const c = DB.insert('coaches', {
        id: `COA_${String(idx+1).padStart(3,'0')}`,
        fullName:  `${first} ${last}`,
        birthday:  `${Utils.randomInt(1975,1990)}-${String(Utils.randomInt(1,12)).padStart(2,'0')}-${String(Utils.randomInt(1,28)).padStart(2,'0')}`,
        gender,
        email:     `${Utils.slugify(first+'.'+last)}@gmail.com`,
        mobile:    `09${Utils.randomInt(100000000,999999999)}`,
        schoolId,
        position:  Utils.randomChoice(['Robotics Teacher','ICT Coordinator','STEM Coordinator','Science Teacher','Math Teacher']),
        shirtSize: Utils.randomChoice(['S','M','L','XL','XXL']),
        emergencyContact: `${Utils.randomChoice(this.COACH_FIRST_NAMES)} ${Utils.randomChoice(this.COACH_LAST_NAMES)} - 09${Utils.randomInt(100000000,999999999)}`,
        certifications: Utils.randomChoice(['WRO Certified Coach','LEGO Education Certified','Robotics Instructor Level 1','None']),
        yearsCoaching: Utils.randomInt(1, 8),
        previousAwards: Utils.randomChoice(['Champion 2023','Best Coach 2022','None','Best Coach 2024']),
        status: 'active',
      });
      coachIds.push(c.id);
    });

    // ── 4. Students ───────────────────────────────────────
    const studentIds = [];
    for (let i = 0; i < 120; i++) {
      const gender = Utils.randomChoice(['Male','Female']);
      const first  = this.STUDENT_FIRST_NAMES[i % this.STUDENT_FIRST_NAMES.length];
      const last   = this.STUDENT_LAST_NAMES[i % this.STUDENT_LAST_NAMES.length];
      const birthYear = Utils.randomInt(2006, 2014);
      const s = DB.insert('students', {
        id: `STU_${String(i+1).padStart(4,'0')}`,
        fullName:     `${first} ${last}`,
        birthday:     `${birthYear}-${String(Utils.randomInt(1,12)).padStart(2,'0')}-${String(Utils.randomInt(1,28)).padStart(2,'0')}`,
        age:          2025 - birthYear,
        gender,
        gradeLevel:   Utils.randomChoice(['Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']),
        schoolId:     Utils.randomChoice(schoolIds),
        parentName:   `${Utils.randomChoice(this.COACH_FIRST_NAMES)} ${last}`,
        parentContact:`09${Utils.randomInt(100000000,999999999)}`,
        parentEmail:  `parent.${Utils.slugify(last)}@gmail.com`,
        medicalConditions: Utils.randomChoice(['None','Asthma','Allergic Rhinitis','None','None']),
        allergies:    Utils.randomChoice(['None','Seafood','Peanuts','None','None']),
        shirtSize:    Utils.randomChoice(['XS','S','M','L','XL']),
        previousParticipation: Utils.randomInt(0, 4),
        consentSigned: true,
        status: 'active',
      });
      studentIds.push(s.id);
    }

    // ── 5. Competitions ───────────────────────────────────
    const compIds = [];
    const compData = [
      { name: 'WRO Philippines 2022 National Finals', season: 'WRO 2022', theme: 'Smart Cities', date: '2022-09-17' },
      { name: 'WRO Philippines 2023 National Finals', season: 'WRO 2023', theme: 'Connecting the World', date: '2023-09-16' },
      { name: 'WRO Philippines 2024 National Finals', season: 'WRO 2024', theme: 'Earth Allies', date: '2024-09-14' },
      { name: 'WRO Philippines 2025 National Finals', season: 'WRO 2025', theme: 'Future Innovators', date: '2025-09-20' },
    ];
    compData.forEach((comp, idx) => {
      const c = DB.insert('competitions', {
        id: `COMP_${String(idx+1).padStart(3,'0')}`,
        ...comp,
        venue:    this.VENUES[idx],
        organizer:'WRO Philippines National Office',
        registrationDeadline: comp.date.replace(/\d{2}$/, '01'),
        categories: this.WRO_CATEGORIES,
        numberOfTeams:   Utils.randomInt(80, 150),
        numberOfSchools: Utils.randomInt(40, 90),
        numberOfCoaches: Utils.randomInt(50, 100),
        numberOfStudents:Utils.randomInt(200, 400),
        status: idx < 3 ? 'completed' : 'upcoming',
      });
      compIds.push(c.id);
    });

    // ── 6. Teams ──────────────────────────────────────────
    const teamIds = [];
    const seasons = this.SEASONS;
    for (let i = 0; i < 60; i++) {
      const category  = this.WRO_CATEGORIES[i % this.WRO_CATEGORIES.length];
      const schoolIdx = i % schoolIds.length;
      const compIdx   = i % compIds.length;
      const members   = [studentIds[i*2 % studentIds.length], studentIds[(i*2+1) % studentIds.length]];
      const t = DB.insert('teams', {
        id:    `TEAM_${String(i+1).padStart(4,'0')}`,
        season: seasons[compIdx],
        competitionId: compIds[compIdx],
        teamName:  `${this.TEAM_NAMES[i % this.TEAM_NAMES.length]} ${i+1}`,
        category,
        ageGroup:  category.includes('Elementary') ? 'Elementary' : category.includes('Junior') ? 'Junior' : 'Senior',
        schoolId:  schoolIds[schoolIdx],
        coachId:   coachIds[schoolIdx],
        members,
        robotPlatform:     Utils.randomChoice(this.ROBOT_PLATFORMS),
        programmingLanguage: Utils.randomChoice(this.PROGRAMMING_LANGUAGES),
        registrationStatus: Utils.randomChoice(['registered','confirmed','waitlisted']),
        paymentStatus:     Utils.randomChoice(['paid','unpaid','partial']),
        qualificationStatus: Utils.randomChoice(['qualified','pending','disqualified']),
        status: 'active',
      });
      teamIds.push(t.id);
    }

    // ── 7. Judging Records ────────────────────────────────
    const judgeNames = ['Dr. Jose Reyes','Engr. Maria Santos','Prof. Carlos Bautista','Dr. Ana Cruz','Engr. Roberto Torres'];
    teamIds.slice(0, 30).forEach((teamId, i) => {
      const score = Utils.randomInt(60, 100);
      DB.insert('judging', {
        id:         `JDG_${String(i+1).padStart(4,'0')}`,
        teamId,
        judgeName:  judgeNames[i % judgeNames.length],
        category:   this.WRO_CATEGORIES[i % this.WRO_CATEGORIES.length],
        criteria:   { robotDesign: Utils.randomInt(10,20), programming: Utils.randomInt(10,20), missionPoints: Utils.randomInt(30,60) },
        score,
        comments:   'Team performed well. Robot design is innovative.',
        violations: Utils.randomChoice(['None','None','None','Minor penalty -5']),
        finalScore: score,
        ranking:    i + 1,
        status:     'finalized',
      });
    });

    // ── 8. Awards ─────────────────────────────────────────
    const awardWinners = teamIds.slice(0, 20);
    awardWinners.forEach((teamId, i) => {
      const teamData = DB.getById('teams', teamId);
      DB.insert('awards', {
        id:      `AWD_${String(i+1).padStart(4,'0')}`,
        teamId,
        schoolId: teamData?.schoolId,
        coachId:  teamData?.coachId,
        category: this.WRO_CATEGORIES[i % this.WRO_CATEGORIES.length],
        award:    this.AWARDS_LIST[i % this.AWARDS_LIST.length],
        year:     2022 + (i % 4),
        event:    `WRO Philippines ${2022 + (i % 4)} National Finals`,
        hasTrophy:  i < 5,
        hasMedal:   i < 15,
        hasCertificate: true,
        status: 'confirmed',
      });
    });

    // ── 9. Payments ───────────────────────────────────────
    teamIds.forEach((teamId, i) => {
      const fee   = Utils.randomChoice([3000,3500,4000,5000]);
      const paid  = Utils.randomChoice([true, true, false]);
      DB.insert('payments', {
        id:              `PAY_${String(i+1).padStart(4,'0')}`,
        teamId,
        schoolId:        DB.getById('teams', teamId)?.schoolId,
        registrationFee: fee,
        amountPaid:      paid ? fee : Utils.randomChoice([0, fee/2]),
        balance:         paid ? 0 : fee,
        paymentDate:     paid ? `2025-0${Utils.randomInt(1,7)}-${String(Utils.randomInt(1,28)).padStart(2,'0')}` : null,
        paymentMethod:   paid ? Utils.randomChoice(this.PAYMENT_METHODS) : null,
        orNumber:        paid ? `OR-${Utils.randomInt(10000,99999)}` : null,
        sponsorship:     Utils.randomChoice([0,0,0,1000,2000]),
        scholarship:     Utils.randomChoice([false,false,true]) ? 'Full' : 'None',
        status:          paid ? 'paid' : 'unpaid',
      });
    });

    // ── 10. Communications ────────────────────────────────
    teamIds.slice(0, 40).forEach((teamId, i) => {
      DB.insert('communications', {
        id: `COM_${String(i+1).padStart(4,'0')}`,
        teamId,
        registrationConfirmation: true,
        paymentConfirmation: i % 2 === 0,
        certificateSent: i < 10,
        emailHistory: [
          { date: '2025-07-01', subject: 'Registration Confirmed', to: 'coach@school.edu.ph', status: 'delivered' },
        ],
        smsHistory: [],
        announcementReceived: true,
        feedbackSubmitted: i < 15,
        status: 'active',
      });
    });

    // ── 11. International Delegation ──────────────────────
    const intlTeams = teamIds.slice(0, 8);
    const countries = ['Turkey','Germany','Indonesia','Thailand','Japan','South Korea','Brazil','USA'];
    intlTeams.forEach((teamId, i) => {
      DB.insert('delegation', {
        id:               `DEL_${String(i+1).padStart(3,'0')}`,
        teamId,
        destinationCountry: countries[i],
        wroYear:          2024 + Math.floor(i/4),
        passportStatus:   Utils.randomChoice(['submitted','processing','approved']),
        passportExpiry:   '2027-12-31',
        visaStatus:       Utils.randomChoice(['not required','applied','approved']),
        parentConsent:    true,
        flight:           `${Utils.randomChoice(['PAL','Cebu Pacific','Singapore Airlines'])} - ${Utils.randomChoice(['MNL-IST','MNL-FRA','MNL-CGK'])}`,
        hotel:            `${Utils.randomChoice(['Marriott','Hilton','Novotel','Holiday Inn'])} Hotel`,
        dietaryRestrictions: Utils.randomChoice(['None','Halal','Vegetarian','None']),
        shirtSize:        Utils.randomChoice(['S','M','L','XL']),
        emergencyContact: `09${Utils.randomInt(100000000,999999999)}`,
        status:           'confirmed',
      });
    });

    DB.markSeeded();
    console.log('[Seeder] Database seeded successfully!');
    console.log(`[Seeder] Schools: ${schoolIds.length}, Coaches: ${coachIds.length}, Students: ${studentIds.length}, Teams: ${teamIds.length}`);
  }
};

window.Seeder = Seeder;
