// Made-up sample patients for City District Hospital (never real personal data).
// Initial seed sets MED counter at 41 so the very next General Medicine registration gets MED-042!

export const PERSONA_KAMLA = {
  firstName: 'Kamla',
  firstNameHi: 'कमला',
  age: 62,
  gender: 'female',
  mobile: '9800012345',
  categoryId: 'bon',
  avoidStairs: true,
};

export const INITIAL_SEED_PATIENTS = [
  // General Medicine Room 1 (serving MED-034, waiting MED-036, MED-038, MED-040)
  { token: 'MED-034', firstName: 'Ramesh', age: 58, gender: 'male', departmentId: 'med_1', status: 'serving' },
  { token: 'MED-036', firstName: 'Savita', age: 49, gender: 'female', departmentId: 'med_1', status: 'waiting' },
  { token: 'MED-038', firstName: 'Mohan', age: 67, gender: 'male', departmentId: 'med_1', status: 'waiting' },
  { token: 'MED-040', firstName: 'Geeta', age: 54, gender: 'female', departmentId: 'med_1', status: 'waiting' },

  // General Medicine Room 2 (serving MED-035, waiting MED-037, MED-039, MED-041)
  { token: 'MED-035', firstName: 'Iqbal', age: 61, gender: 'male', departmentId: 'med_2', status: 'serving' },
  { token: 'MED-037', firstName: 'Lakshmi', age: 64, gender: 'female', departmentId: 'med_2', status: 'waiting' },
  { token: 'MED-039', firstName: 'Suresh', age: 44, gender: 'male', departmentId: 'med_2', status: 'waiting' },
  { token: 'MED-041', firstName: 'Asha', age: 52, gender: 'female', departmentId: 'med_2', status: 'waiting' },

  // Children Room 3
  { token: 'CHD-014', firstName: 'Aarav', age: 4, gender: 'male', departmentId: 'chd', status: 'serving' },
  { token: 'CHD-015', firstName: 'Gudiya', age: 7, gender: 'female', departmentId: 'chd', status: 'waiting' },
  { token: 'CHD-016', firstName: 'Rohan', age: 2, gender: 'male', departmentId: 'chd', status: 'waiting' },
  { token: 'CHD-017', firstName: 'Pari', age: 5, gender: 'female', departmentId: 'chd', status: 'waiting' },

  // Women and pregnancy Room 4
  { token: 'WOM-021', firstName: 'Pooja', age: 26, gender: 'female', departmentId: 'wom', status: 'serving' },
  { token: 'WOM-022', firstName: 'Rekha', age: 31, gender: 'female', departmentId: 'wom', status: 'waiting' },
  { token: 'WOM-023', firstName: 'Nagma', age: 24, gender: 'female', departmentId: 'wom', status: 'waiting' },

  // Bones and joints Room 5
  { token: 'BON-018', firstName: 'Baldev', age: 70, gender: 'male', departmentId: 'bon', status: 'serving' },
  { token: 'BON-019', firstName: 'Shanti', age: 65, gender: 'female', departmentId: 'bon', status: 'waiting' },
  { token: 'BON-020', firstName: 'Dinesh', age: 51, gender: 'male', departmentId: 'bon', status: 'waiting' },
  { token: 'BON-021', firstName: 'Kanta', age: 60, gender: 'female', departmentId: 'bon', status: 'waiting' },

  // ENT Room 6
  { token: 'ENT-011', firstName: 'Karan', age: 33, gender: 'male', departmentId: 'ent', status: 'serving' },
  { token: 'ENT-012', firstName: 'Munni', age: 57, gender: 'female', departmentId: 'ent', status: 'waiting' },
  { token: 'ENT-013', firstName: 'Deepak', age: 29, gender: 'male', departmentId: 'ent', status: 'waiting' },

  // Eyes Room 7
  { token: 'EYE-025', firstName: 'Bansi', age: 72, gender: 'male', departmentId: 'eye', status: 'serving' },
  { token: 'EYE-026', firstName: 'Phoolmati', age: 68, gender: 'female', departmentId: 'eye', status: 'waiting' },
  { token: 'EYE-027', firstName: 'Gurmeet', age: 63, gender: 'male', departmentId: 'eye', status: 'waiting' },

  // Skin Room 8
  { token: 'SKN-009', firstName: 'Anita', age: 28, gender: 'female', departmentId: 'skn', status: 'serving' },
  { token: 'SKN-010', firstName: 'Vikas', age: 36, gender: 'male', departmentId: 'skn', status: 'waiting' },
];

export const INITIAL_COUNTERS = {
  MED: 41,
  CHD: 17,
  WOM: 23,
  BON: 21,
  ENT: 13,
  EYE: 27,
  SKN: 10,
};

// 20 made-up sample patients added when clicking "Add 20 sample patients" on Staff Dashboard
export const DEMO_SAMPLE_BATCH_20 = [
  { firstName: 'Bhagwati', age: 66, gender: 'female', categoryId: 'med' },
  { firstName: 'Harbans', age: 71, gender: 'male', categoryId: 'med' },
  { firstName: 'Sunita', age: 45, gender: 'female', categoryId: 'med' },
  { firstName: 'Rafiq', age: 59, gender: 'male', categoryId: 'med' },
  { firstName: 'Bimla', age: 63, gender: 'female', categoryId: 'bon' },
  { firstName: 'Jaswinder', age: 55, gender: 'male', categoryId: 'bon' },
  { firstName: 'Chintu', age: 6, gender: 'male', categoryId: 'chd' },
  { firstName: 'Ananya', age: 3, gender: 'female', categoryId: 'chd' },
  { firstName: 'Salma', age: 27, gender: 'female', categoryId: 'wom' },
  { firstName: 'Kiran', age: 29, gender: 'female', categoryId: 'wom' },
  { firstName: 'Mahendra', age: 68, gender: 'male', categoryId: 'eye' },
  { firstName: 'Saraswati', age: 74, gender: 'female', categoryId: 'eye' },
  { firstName: 'Pankaj', age: 38, gender: 'male', categoryId: 'ent' },
  { firstName: 'Usha', age: 53, gender: 'female', categoryId: 'ent' },
  { firstName: 'Raju', age: 22, gender: 'male', categoryId: 'skn' },
  { firstName: 'Meera', age: 41, gender: 'female', categoryId: 'skn' },
  { firstName: 'Govind', age: 60, gender: 'male', categoryId: 'med' },
  { firstName: 'Pushpa', age: 58, gender: 'female', categoryId: 'bon' },
  { firstName: 'Kabir', age: 8, gender: 'male', categoryId: 'chd' },
  { firstName: 'Lata', age: 48, gender: 'female', categoryId: 'eye' },
];
