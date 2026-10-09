import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// --------------------------------------------------
// Seed Data for Eco Space: Higher Schools of Economics & Management
// --------------------------------------------------
async function main() {
  console.log('🌱 Starting database seed for Eco Space institutions...\n');

  // ==============================
  // 1. Institutions
  // ==============================
  const institutionsData = [
    {
      name: 'École Supérieure de Commerce',
      shortCode: 'ESC',
      focus: 'Traditional commerce, corporate finance, and accounting.',
      description:
        'National school specializing in traditional commerce, accounting, corporate finance, banking, and management control.',
    },
    {
      name: 'École des Hautes Études Commerciales',
      shortCode: 'EHEC',
      focus:
        'Advanced commercial strategy, supply chain, and international business (formerly INC).',
      description:
        'Premier business school focused on marketing management, international trade, supply chain logistics, and entrepreneurship.',
    },
    {
      name: 'École Nationale Supérieure de Management',
      shortCode: 'ENSM',
      focus:
        'Corporate leadership, organizational strategy, and project management.',
      description:
        'Specialized institution in corporate leadership, organization strategy, quality management, e-government, and HR management.',
    },
    {
      name: "École Supérieure de Gestion et d'Économie Numérique",
      shortCode: 'ESGEN',
      focus:
        'The intersection of digital technology, IT governance, and modern business economics.',
      description:
        'Innovative institution at the crossroads of digital management, FinTech, IT governance, e-commerce, and digital auditing.',
    },
    {
      name: 'École Nationale Supérieure de Statistique et d\'Économie Appliquée',
      shortCode: 'ENSSEA',
      focus:
        'Applied mathematics, data analytics, and actuarial science (formerly INPS).',
      description:
        'Elite institution for statistics, actuarial science, applied economics, econometrics, and operations research.',
    },
  ];

  const institutionsMap = {};

  for (const inst of institutionsData) {
    const record = await prisma.institution.upsert({
      where: { shortCode: inst.shortCode },
      update: {
        name: inst.name,
        focus: inst.focus,
        description: inst.description,
      },
      create: inst,
    });
    institutionsMap[inst.shortCode] = record;
    console.log(`  ✅ Institution: ${record.shortCode} - ${record.name} (ID: ${record.id})`);
  }

  // ==============================
  // 2. Courses per Institution
  // ==============================

  const coursesBySchool = {
    // ----------------------------------------------------
    // ESC - École Supérieure de Commerce
    // Focus: Traditional commerce, corporate finance, and accounting.
    // ----------------------------------------------------
    ESC: [
      // Preparatory Years (1CP & 2CP)
      { title: 'Introduction au Commerce et à l\'Économie', code: 'ESC-COM101', yearLevel: '1CP', semester: 1 },
      { title: 'Microéconomie 1', code: 'ESC-MIC101', yearLevel: '1CP', semester: 1 },
      { title: 'Comptabilité Générale 1', code: 'ESC-CPT101', yearLevel: '1CP', semester: 1 },
      { title: 'Macroéconomie 1', code: 'ESC-MAC102', yearLevel: '1CP', semester: 2 },
      { title: 'Mathématiques Financières', code: 'ESC-MF102', yearLevel: '1CP', semester: 2 },
      { title: 'Comptabilité Générale 2', code: 'ESC-CPT102', yearLevel: '1CP', semester: 2 },
      { title: 'Comptabilité Analytique', code: 'ESC-CA201', yearLevel: '2CP', semester: 1 },
      { title: 'Statistiques Inférentielles', code: 'ESC-STAT201', yearLevel: '2CP', semester: 1 },
      { title: 'Droit Commercial et des Affaires', code: 'ESC-LAW202', yearLevel: '2CP', semester: 2 },
      { title: 'Gestion Budgétaire et Financière', code: 'ESC-GB202', yearLevel: '2CP', semester: 2 },

      // Specialty: Accounting and Finance (Comptabilité et Finance)
      { title: 'Comptabilité Approfondie & Normes SCF/IFRS', code: 'ESC-CF301', yearLevel: '1CS', semester: 1 },
      { title: 'Analyse Financière & Diagnostic', code: 'ESC-CF302', yearLevel: '1CS', semester: 2 },
      { title: 'Fiscalité des Entreprises', code: 'ESC-CF401', yearLevel: '2CS', semester: 1 },

      // Specialty: Banking and Monetary Economics (Économie Monétaire et Bancaire)
      { title: 'Économie Monétaire et Marchés de Capitaux', code: 'ESC-EMB301', yearLevel: '1CS', semester: 1 },
      { title: 'Gestion des Risques et Techniques Bancaires', code: 'ESC-EMB302', yearLevel: '1CS', semester: 2 },

      // Specialty: Business Finance (Finance d'entreprise)
      { title: 'Décisions d\'Investissement et Financement', code: 'ESC-FE301', yearLevel: '1CS', semester: 1 },
      { title: 'Ingénierie Financière & Évaluation d\'Entreprise', code: 'ESC-FE302', yearLevel: '1CS', semester: 2 },

      // Specialty: Audit and Management Control (Audit et Contrôle de Gestion)
      { title: 'Audit Comptable et Financier', code: 'ESC-ACG301', yearLevel: '1CS', semester: 1 },
      { title: 'Contrôle de Gestion & Tableaux de Bord', code: 'ESC-ACG302', yearLevel: '1CS', semester: 2 },

      // Specialty: Marketing
      { title: 'Marketing Stratégique & Études de Marché', code: 'ESC-MKT301', yearLevel: '1CS', semester: 1 },
      { title: 'Marketing Opérationnel & Distribution', code: 'ESC-MKT302', yearLevel: '1CS', semester: 2 },
    ],

    // ----------------------------------------------------
    // EHEC - École des Hautes Études Commerciales
    // Focus: Advanced commercial strategy, supply chain, and international business (formerly INC).
    // ----------------------------------------------------
    EHEC: [
      // Preparatory Years (1CP & 2CP)
      { title: 'Principes de Management et d\'Organisation', code: 'EHEC-MGT101', yearLevel: '1CP', semester: 1 },
      { title: 'Économie d\'Entreprise', code: 'EHEC-ECO101', yearLevel: '1CP', semester: 1 },
      { title: 'Mathématiques Appliquées à la Gestion', code: 'EHEC-MATH102', yearLevel: '1CP', semester: 2 },
      { title: 'Comptabilité et Finance Fondamentale', code: 'EHEC-FIN102', yearLevel: '1CP', semester: 2 },
      { title: 'Fondements du Commerce International', code: 'EHEC-CI201', yearLevel: '2CP', semester: 1 },
      { title: 'Négociation Commerciale et Stratégie', code: 'EHEC-STR202', yearLevel: '2CP', semester: 2 },

      // Specialty: Marketing Management & Digital Marketing
      { title: 'Brand Management & Stratégie de Marque', code: 'EHEC-MM301', yearLevel: '1CS', semester: 1 },
      { title: 'Marketing Digital & E-Business Strategy', code: 'EHEC-DM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Supply Chain, Logistics, and Distribution
      { title: 'Management de la Supply Chain', code: 'EHEC-SC301', yearLevel: '1CS', semester: 1 },
      { title: 'Logistique Internationale et Douanes', code: 'EHEC-LOG302', yearLevel: '1CS', semester: 2 },

      // Specialty: Corporate Finance
      { title: 'Finance d\'Entreprise & Choix Financiers', code: 'EHEC-CF301', yearLevel: '1CS', semester: 1 },
      { title: 'Gestion de Trésorerie et Risques Financiers', code: 'EHEC-CF302', yearLevel: '1CS', semester: 2 },

      // Specialty: International Affairs / International Trade
      { title: 'Techniques du Commerce International', code: 'EHEC-IT301', yearLevel: '1CS', semester: 1 },
      { title: 'Géopolitique et Stratégies d\'Exportation', code: 'EHEC-IA302', yearLevel: '1CS', semester: 2 },

      // Specialty: Human Resources Management
      { title: 'Management des Ressources Humaines', code: 'EHEC-HRM301', yearLevel: '1CS', semester: 1 },
      { title: 'Gestion des Talents et Relations Sociales', code: 'EHEC-HRM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Management and Entrepreneurship
      { title: 'Stratégie d\'Entreprise et Business Models', code: 'EHEC-ENT301', yearLevel: '1CS', semester: 1 },
      { title: 'Création d\'Entreprise & Entrepreneuriat', code: 'EHEC-ENT302', yearLevel: '1CS', semester: 2 },
    ],

    // ----------------------------------------------------
    // ENSM - École Nationale Supérieure de Management
    // Focus: Corporate leadership, organizational strategy, and project management.
    // ----------------------------------------------------
    ENSM: [
      // Preparatory Years (1CP & 2CP)
      { title: 'Théorie des Organisations', code: 'ENSM-ORG101', yearLevel: '1CP', semester: 1 },
      { title: 'Management Général & Leadership', code: 'ENSM-MGT101', yearLevel: '1CP', semester: 1 },
      { title: 'Économie Managériale et Décisionnelle', code: 'ENSM-ECO102', yearLevel: '1CP', semester: 2 },
      { title: 'Outils Quantitatifs de Gestion', code: 'ENSM-OQ102', yearLevel: '1CP', semester: 2 },
      { title: 'Fondements de la Gestion de Projet', code: 'ENSM-PM201', yearLevel: '2CP', semester: 1 },
      { title: 'Sociologie des Organisations et Éthique', code: 'ENSM-SOC202', yearLevel: '2CP', semester: 2 },

      // Specialty: Management of Organizations
      { title: 'Gouvernance & Diagnostic Organisationnel', code: 'ENSM-MO301', yearLevel: '1CS', semester: 1 },
      { title: 'Conduite du Changement Organisationnel', code: 'ENSM-MO302', yearLevel: '1CS', semester: 2 },

      // Specialty: Quality Management
      { title: 'Systèmes de Management de la Qualité (ISO)', code: 'ENSM-QM301', yearLevel: '1CS', semester: 1 },
      { title: 'Audit Qualité & Amélioration Continue', code: 'ENSM-QM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Human Resources Management
      { title: 'Management Stratégique des Ressources Humaines', code: 'ENSM-HRM301', yearLevel: '1CS', semester: 1 },
      { title: 'Droit du Travail & Gestion des Compétences', code: 'ENSM-HRM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Strategic Management and Information Systems
      { title: 'Alignement Stratégique et Systèmes d\'Information', code: 'ENSM-SMIS301', yearLevel: '1CS', semester: 1 },
      { title: 'Transformation Numérique des Entreprises', code: 'ENSM-SMIS302', yearLevel: '1CS', semester: 2 },

      // Specialty: E-Government Management
      { title: 'Administration Électronique & Management Public', code: 'ENSM-EGM301', yearLevel: '1CS', semester: 1 },
      { title: 'Modernisation des Services Publics & Open Data', code: 'ENSM-EGM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Entrepreneurship and Project Management
      { title: 'Management de Projets Complexes (PMP / Agile)', code: 'ENSM-EPM301', yearLevel: '1CS', semester: 1 },
      { title: 'Incubation, Startups & Management de l\'Innovation', code: 'ENSM-EPM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Supply Chain Management
      { title: 'Stratégie des Achats et Approvisionnements', code: 'ENSM-SCM301', yearLevel: '1CS', semester: 1 },
      { title: 'Optimisation Logistique & Supply Chain Durable', code: 'ENSM-SCM302', yearLevel: '1CS', semester: 2 },
    ],

    // ----------------------------------------------------
    // ESGEN - École Supérieure de Gestion et d'Économie Numérique
    // Focus: The intersection of digital technology, IT governance, and modern business economics.
    // ----------------------------------------------------
    ESGEN: [
      // Preparatory Years (1CP & 2CP)
      { title: 'Introduction à l\'Économie Numérique', code: 'ESGEN-DEN101', yearLevel: '1CP', semester: 1 },
      { title: 'Algorithmique et Outils Numériques', code: 'ESGEN-INF101', yearLevel: '1CP', semester: 1 },
      { title: 'Systèmes d\'Information & Bases de Données', code: 'ESGEN-SI102', yearLevel: '1CP', semester: 2 },
      { title: 'Mathématiques & Statistiques pour la Gestion', code: 'ESGEN-MATH102', yearLevel: '1CP', semester: 2 },
      { title: 'Économie des Plateformes et Données', code: 'ESGEN-PLT201', yearLevel: '2CP', semester: 1 },
      { title: 'Cyber-sécurité & Droit du Numérique', code: 'ESGEN-LAW202', yearLevel: '2CP', semester: 2 },

      // Specialty: Digital Management (Management Digital)
      { title: 'Management Agile & Leadership Digital', code: 'ESGEN-DM301', yearLevel: '1CS', semester: 1 },
      { title: 'Stratégies de Transformation Digitale', code: 'ESGEN-DM302', yearLevel: '1CS', semester: 2 },

      // Specialty: Financial Technologies (FinTech)
      { title: 'Technologies Financières & Blockchain', code: 'ESGEN-FT301', yearLevel: '1CS', semester: 1 },
      { title: 'Paiements Numériques, Cryptos & Régulation', code: 'ESGEN-FT302', yearLevel: '1CS', semester: 2 },

      // Specialty: Information Systems Governance
      { title: 'Gouvernance des SI (COBIT, ITIL)', code: 'ESGEN-ISG301', yearLevel: '1CS', semester: 1 },
      { title: 'Audit et Sécurité des Systèmes d\'Information', code: 'ESGEN-ISG302', yearLevel: '1CS', semester: 2 },

      // Specialty: E-Commerce
      { title: 'Plateformes E-Commerce & Growth Marketing', code: 'ESGEN-EC301', yearLevel: '1CS', semester: 1 },
      { title: 'Logistique E-Commerce & Expérience Utilisateur (UX)', code: 'ESGEN-EC302', yearLevel: '1CS', semester: 2 },

      // Specialty: Audit and Management Control
      { title: 'Audit des Systèmes d\'Information & Données', code: 'ESGEN-AMC301', yearLevel: '1CS', semester: 1 },
      { title: 'Contrôle de Gestion Numérique & Business Analytics', code: 'ESGEN-AMC302', yearLevel: '1CS', semester: 2 },
    ],

    // ----------------------------------------------------
    // ENSSEA - École Nationale Supérieure de Statistique et d'Économie Appliquée
    // Focus: Applied mathematics, data analytics, and actuarial science (formerly INPS).
    // ----------------------------------------------------
    ENSSEA: [
      // Preparatory Years (1CP & 2CP)
      { title: 'Analyse Mathématique & Algèbre Linéaire', code: 'ENSSEA-MATH101', yearLevel: '1CP', semester: 1 },
      { title: 'Statistique Descriptive et Probabilités', code: 'ENSSEA-STAT101', yearLevel: '1CP', semester: 1 },
      { title: 'Microéconomie et Macroéconomie Théorique', code: 'ENSSEA-ECO102', yearLevel: '1CP', semester: 2 },
      { title: 'Calcul des Probabilités Approfondi', code: 'ENSSEA-PROB102', yearLevel: '1CP', semester: 2 },
      { title: 'Inférence Statistique & Économétrie 1', code: 'ENSSEA-ECM201', yearLevel: '2CP', semester: 1 },
      { title: 'Programmation Statistique (R & Python)', code: 'ENSSEA-PROG202', yearLevel: '2CP', semester: 2 },

      // Specialty: Finance and Actuarial Science (Finance et Actuariat)
      { title: 'Mathématiques Actuarielles (Assurance Vie & Non-Vie)', code: 'ENSSEA-ACT301', yearLevel: '1CS', semester: 1 },
      { title: 'Modélisation Financière et Gestion des Risques', code: 'ENSSEA-ACT302', yearLevel: '1CS', semester: 2 },

      // Specialty: Applied Economics and Foresight (Économie Appliquée et Prospective)
      { title: 'Économétrie Avancée & Séries Temporelles', code: 'ENSSEA-AEP301', yearLevel: '1CS', semester: 1 },
      { title: 'Prospective Économique & Modélisation Macroéconomique', code: 'ENSSEA-AEP302', yearLevel: '1CS', semester: 2 },

      // Specialty: Statistics and Data Analysis
      { title: 'Analyse des Données Multidimensionnelles (ACP, AFC)', code: 'ENSSEA-SDA301', yearLevel: '1CS', semester: 1 },
      { title: 'Data Mining & Machine Learning Appliqué', code: 'ENSSEA-SDA302', yearLevel: '1CS', semester: 2 },

      // Specialty: Operations Research
      { title: 'Recherche Opérationnelle & Optimisation Linéaire', code: 'ENSSEA-RO301', yearLevel: '1CS', semester: 1 },
      { title: 'Processus Stochastiques et Théorie des Graphes', code: 'ENSSEA-RO302', yearLevel: '1CS', semester: 2 },
    ],
  };

  for (const [shortCode, courses] of Object.entries(coursesBySchool)) {
    const institution = institutionsMap[shortCode];
    if (!institution) continue;

    console.log(`\n  📚 Seeding ${shortCode} courses (${courses.length} courses)...`);
    for (const course of courses) {
      const existing = await prisma.course.findFirst({
        where: {
          institutionId: institution.id,
          code: course.code,
        },
      });

      if (!existing) {
        await prisma.course.create({
          data: {
            ...course,
            institutionId: institution.id,
          },
        });
      } else {
        await prisma.course.update({
          where: { id: existing.id },
          data: {
            title: course.title,
            yearLevel: course.yearLevel,
            semester: course.semester,
          },
        });
      }
    }
    console.log(`  ✅ ${shortCode} courses synced.`);
  }

  // ==============================
  // 3. Admin User Setup
  // ==============================
  const adminEmail = 'admin@ecospace.dz';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const defaultSchool = institutionsMap['ESC'] || Object.values(institutionsMap)[0];

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@2024!', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'Eco Space Admin',
        phoneNumber: '+213550000000',
        sex: 'MALE',
        isAdmin: true,
        paymentStatus: 'ACTIVE',
        paidUntil: new Date('2030-12-31'),
        institutionId: defaultSchool.id,
        studyLevel: '1CS',
      },
    });
    console.log(`\n  👤 Admin user created: ${admin.email}`);
  } else {
    // Update admin to valid institution if needed
    if (defaultSchool && (!existingAdmin.institutionId || existingAdmin.institutionId !== defaultSchool.id)) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { institutionId: defaultSchool.id },
      });
    }
    console.log(`\n  👤 Admin user verified: ${adminEmail}`);
  }

  console.log('\n✨ All institutions and courses seeded successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
