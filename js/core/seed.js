// ============================================================
// WRO Philippines DBMS – Reference Constants
// Shared lookup data used across all modules for dropdowns,
// filters, and validation. No demo/seed data lives here.
// ============================================================

const Seeder = {

  // Philippine regions — used by Schools module
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

  // WRO competition categories — used by Teams, Judging, Awards modules
  WRO_CATEGORIES: [
    'RoboMission – Elementary', 'RoboMission – Junior', 'RoboMission – Senior',
    'Future Engineers', 'Future Innovators',
    'RoboSports', 'WeDo', 'Advanced Robotics',
  ],

  // Robot platforms — used by Teams module
  ROBOT_PLATFORMS: [
    'LEGO Mindstorms EV3', 'LEGO Mindstorms NXT', 'LEGO SPIKE Prime',
    'Arduino', 'Raspberry Pi', 'VEX IQ', 'LEGO SPIKE Essential', 'Custom Build',
  ],

  // Programming languages — used by Teams module
  PROGRAMMING_LANGUAGES: [
    'LEGO Mindstorms Software', 'SPIKE App', 'Scratch', 'Python',
    'C++', 'Arduino IDE', 'EV3 Classroom', 'Blockly',
  ],

  // Award types — used by Awards module
  AWARDS_LIST: [
    'Champion', '1st Runner-up', '2nd Runner-up',
    'Best Robot Design', 'Best Programming', 'Best Teamwork',
    'Best Presentation', 'Most Creative', 'Best Rookie Team',
    'Special Award', 'Certificate of Participation',
  ],

  // Payment methods — used by Payments module
  PAYMENT_METHODS: ['Bank Transfer', 'GCash', 'Maya', 'Cash', 'Check', 'Online Payment'],
};

window.Seeder = Seeder;
