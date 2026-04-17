/**
 * Mock Coach Data
 * Used by CoachBrowsingScreen and CoachProfileDetailScreen
 */

export interface MockCoach {
  id: number;
  name: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  ratingCount: number;
  profilePicture?: string;
  certifications: MockCertification[];
  transformations: MockTransformation[];
  reviewStats: {
    totalReviews: number;
    averageRating: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };
}

export interface MockCertification {
  id: string;
  name: string;
  issuer: string;
  year: number;
}

export interface MockTransformation {
  id: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  description: string;
  results: string;
  clientName: string;
  createdAt: string;
}

export interface MockReview {
  id: number;
  coachId: number;
  clientId: number;
  rating: number;
  comment: string;
  isAnonymous: boolean;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Mock Coaches ────────────────────────────────────────────

export const MOCK_COACHES: MockCoach[] = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    bio: 'Certified strength and conditioning specialist with 8+ years of experience helping clients build lean muscle and functional strength. My approach combines progressive overload with smart periodization to deliver consistent, injury-free results.',
    specialties: ['Strength', 'Weight Loss', 'CrossFit'],
    experienceYears: 8,
    rating: 4.8,
    ratingCount: 124,
    certifications: [
      { id: 'c1', name: 'CSCS', issuer: 'NSCA', year: 2018 },
      { id: 'c2', name: 'CPT', issuer: 'NASM', year: 2016 },
    ],
    transformations: [
      {
        id: 't1',
        beforeImageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
        afterImageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400',
        description: '12-week strength program focusing on progressive overload and nutrition optimization.',
        results: 'Lost 12kg of fat, gained 5kg of lean muscle, deadlift increased by 40kg.',
        clientName: 'Mohamed',
        createdAt: '2025-09-15',
      },
    ],
    reviewStats: {
      totalReviews: 124,
      averageRating: 4.8,
      distribution: { 5: 89, 4: 25, 3: 7, 2: 2, 1: 1 },
    },
  },
  {
    id: 2,
    name: 'Sarah Williams',
    bio: 'Passionate about helping people discover the power of nutrition-driven fitness. I specialize in body recomposition, intuitive eating, and creating sustainable habits that last a lifetime — no crash diets, no shortcuts.',
    specialties: ['Nutrition', 'Weight Loss', 'Flexibility'],
    experienceYears: 6,
    rating: 4.9,
    ratingCount: 98,
    certifications: [
      { id: 'c3', name: 'Precision Nutrition Level 2', issuer: 'Precision Nutrition', year: 2020 },
      { id: 'c4', name: 'ACE Health Coach', issuer: 'ACE', year: 2019 },
    ],
    transformations: [
      {
        id: 't2',
        beforeImageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
        afterImageUrl: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=400',
        description: '16-week body recomposition journey with customized macro tracking.',
        results: 'Dropped 3 dress sizes, energy levels doubled, no more afternoon crashes.',
        clientName: 'Layla',
        createdAt: '2025-11-02',
      },
    ],
    reviewStats: {
      totalReviews: 98,
      averageRating: 4.9,
      distribution: { 5: 82, 4: 12, 3: 3, 2: 1, 1: 0 },
    },
  },
  {
    id: 3,
    name: 'Omar Khalil',
    bio: 'Former competitive bodybuilder turned coach. I know what it takes to push limits safely. Whether you want to step on stage or simply look your best, I design hypertrophy-focused programs tailored to your genetics and lifestyle.',
    specialties: ['Strength', 'HIIT', 'Cardio'],
    experienceYears: 11,
    rating: 4.6,
    ratingCount: 201,
    certifications: [
      { id: 'c5', name: 'ISSA Bodybuilding Specialist', issuer: 'ISSA', year: 2015 },
      { id: 'c6', name: 'CPT', issuer: 'ACSM', year: 2014 },
      { id: 'c7', name: 'Sports Nutrition', issuer: 'ISSN', year: 2017 },
    ],
    transformations: [],
    reviewStats: {
      totalReviews: 201,
      averageRating: 4.6,
      distribution: { 5: 130, 4: 42, 3: 18, 2: 8, 1: 3 },
    },
  },
  {
    id: 4,
    name: 'Nour El-Din',
    bio: 'Yoga instructor and mobility specialist. I help athletes and desk workers alike unlock their full range of motion, eliminate chronic pain, and build a resilient body through mindful movement and corrective exercise.',
    specialties: ['Yoga', 'Flexibility', 'Pilates'],
    experienceYears: 9,
    rating: 4.7,
    ratingCount: 76,
    certifications: [
      { id: 'c8', name: 'RYT-500', issuer: 'Yoga Alliance', year: 2017 },
      { id: 'c9', name: 'FMS Level 2', issuer: 'Functional Movement Systems', year: 2019 },
    ],
    transformations: [],
    reviewStats: {
      totalReviews: 76,
      averageRating: 4.7,
      distribution: { 5: 50, 4: 18, 3: 5, 2: 2, 1: 1 },
    },
  },
  {
    id: 5,
    name: 'Dina Mostafa',
    bio: 'HIIT and cardio specialist who makes training fun. My group-style approach keeps you accountable while my individualized programming ensures you progress at the right pace. Expect results in 6 weeks or less.',
    specialties: ['HIIT', 'Cardio', 'Weight Loss'],
    experienceYears: 5,
    rating: 4.5,
    ratingCount: 63,
    certifications: [
      { id: 'c10', name: 'ACE Group Fitness Instructor', issuer: 'ACE', year: 2021 },
    ],
    transformations: [
      {
        id: 't3',
        beforeImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
        afterImageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        description: '8-week HIIT challenge with progressive cardio conditioning.',
        results: 'VO2 max improved by 18%, lost 7kg, resting heart rate dropped 12 BPM.',
        clientName: 'Rana',
        createdAt: '2026-01-10',
      },
    ],
    reviewStats: {
      totalReviews: 63,
      averageRating: 4.5,
      distribution: { 5: 35, 4: 18, 3: 7, 2: 2, 1: 1 },
    },
  },
  {
    id: 6,
    name: 'Karim Abdallah',
    bio: 'CrossFit Level 3 trainer and former regional competitor. I build functional athletes who can perform in any environment. My programming balances strength, conditioning, and gymnastics for well-rounded fitness.',
    specialties: ['CrossFit', 'Strength', 'HIIT'],
    experienceYears: 7,
    rating: 4.4,
    ratingCount: 155,
    certifications: [
      { id: 'c11', name: 'CrossFit Level 3', issuer: 'CrossFit', year: 2019 },
      { id: 'c12', name: 'USAW Sports Performance', issuer: 'USA Weightlifting', year: 2020 },
    ],
    transformations: [],
    reviewStats: {
      totalReviews: 155,
      averageRating: 4.4,
      distribution: { 5: 80, 4: 40, 3: 20, 2: 10, 1: 5 },
    },
  },
];

// ─── Mock Reviews ────────────────────────────────────────────

export const MOCK_REVIEWS: MockReview[] = [
  { id: 1, coachId: 1, clientId: 101, rating: 5, comment: 'Ahmed completely transformed my training. His programming is methodical, progressive, and he genuinely cares about form. Best investment I\'ve made for my health.', isAnonymous: false, authorName: 'Youssef M.', createdAt: '2026-03-20T10:00:00Z', updatedAt: '2026-03-20T10:00:00Z' },
  { id: 2, coachId: 1, clientId: 102, rating: 5, comment: 'Incredible knowledge of biomechanics. Fixed my squat form in the first session and I\'ve been pain-free since.', isAnonymous: false, authorName: 'Tarek A.', createdAt: '2026-03-10T10:00:00Z', updatedAt: '2026-03-10T10:00:00Z' },
  { id: 3, coachId: 1, clientId: 103, rating: 4, comment: 'Great coach, very responsive. Only wish he had more availability on weekends.', isAnonymous: false, authorName: 'Nadia K.', createdAt: '2026-02-28T10:00:00Z', updatedAt: '2026-02-28T10:00:00Z' },
  { id: 4, coachId: 2, clientId: 104, rating: 5, comment: 'Sarah changed my relationship with food. No more yo-yo dieting — I finally understand how to eat for my goals and enjoy doing it.', isAnonymous: false, authorName: 'Mona R.', createdAt: '2026-03-18T10:00:00Z', updatedAt: '2026-03-18T10:00:00Z' },
  { id: 5, coachId: 2, clientId: 105, rating: 5, comment: 'The best nutrition coach I\'ve ever worked with. Patient, knowledgeable, and always available when I have questions.', isAnonymous: false, authorName: 'Hana S.', createdAt: '2026-03-05T10:00:00Z', updatedAt: '2026-03-05T10:00:00Z' },
  { id: 6, coachId: 2, clientId: 106, rating: 4, comment: 'Really good results. Lost 8kg in 3 months following her plan. Highly recommend.', isAnonymous: true, authorName: '', createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-02-15T10:00:00Z' },
  { id: 7, coachId: 3, clientId: 107, rating: 5, comment: 'Omar knows bodybuilding inside and out. My physique has never looked better.', isAnonymous: false, authorName: 'Ali H.', createdAt: '2026-03-22T10:00:00Z', updatedAt: '2026-03-22T10:00:00Z' },
  { id: 8, coachId: 3, clientId: 108, rating: 4, comment: 'Tough but fair. Pushes you just enough. Programs are well structured.', isAnonymous: false, authorName: 'Kareem B.', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-01T10:00:00Z' },
  { id: 9, coachId: 3, clientId: 109, rating: 3, comment: 'Good coach but communication could be better. Sometimes slow to respond.', isAnonymous: true, authorName: '', createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z' },
  { id: 10, coachId: 4, clientId: 110, rating: 5, comment: 'Nour fixed my chronic back pain that physiotherapy couldn\'t. His mobility work is life-changing.', isAnonymous: false, authorName: 'Salma W.', createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-03-15T10:00:00Z' },
  { id: 11, coachId: 4, clientId: 111, rating: 5, comment: 'Best yoga instructor I\'ve found. Classes are challenging but accessible to all levels.', isAnonymous: false, authorName: 'Dalia F.', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-02-20T10:00:00Z' },
  { id: 12, coachId: 5, clientId: 112, rating: 5, comment: 'Dina makes every session exciting! Lost 5kg in 6 weeks and actually enjoyed the process.', isAnonymous: false, authorName: 'Fatma Z.', createdAt: '2026-03-12T10:00:00Z', updatedAt: '2026-03-12T10:00:00Z' },
  { id: 13, coachId: 5, clientId: 113, rating: 4, comment: 'High energy sessions, great group atmosphere. Would recommend for anyone who hates boring cardio.', isAnonymous: false, authorName: 'Amira L.', createdAt: '2026-02-25T10:00:00Z', updatedAt: '2026-02-25T10:00:00Z' },
  { id: 14, coachId: 6, clientId: 114, rating: 5, comment: 'Karim\'s CrossFit programming is top-notch. I PR\'d in every lift within 3 months.', isAnonymous: false, authorName: 'Mahmoud T.', createdAt: '2026-03-08T10:00:00Z', updatedAt: '2026-03-08T10:00:00Z' },
  { id: 15, coachId: 6, clientId: 115, rating: 4, comment: 'Great coaching, really knows his stuff. The Box programming is challenging and well-balanced.', isAnonymous: false, authorName: 'Hassan D.', createdAt: '2026-02-18T10:00:00Z', updatedAt: '2026-02-18T10:00:00Z' },
  { id: 16, coachId: 6, clientId: 116, rating: 3, comment: 'Decent programming but the classes can be overcrowded sometimes.', isAnonymous: true, authorName: '', createdAt: '2026-01-30T10:00:00Z', updatedAt: '2026-01-30T10:00:00Z' },
];

// ─── Helper Functions ────────────────────────────────────────

export const getMockCoaches = (filters?: {
  specialty?: string;
  minRating?: number;
}): MockCoach[] => {
  let result = [...MOCK_COACHES];

  if (filters?.specialty) {
    result = result.filter(c => c.specialties.includes(filters.specialty!));
  }
  if (filters?.minRating) {
    result = result.filter(c => c.rating >= filters.minRating!);
  }

  return result;
};

export const getMockCoachById = (id: number): MockCoach | undefined => {
  return MOCK_COACHES.find(c => c.id === id);
};

export const getMockReviewsForCoach = (coachId: number): MockReview[] => {
  return MOCK_REVIEWS.filter(r => r.coachId === coachId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
