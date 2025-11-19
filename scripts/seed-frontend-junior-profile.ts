/**
 * Script untuk mengisi data profile frontend developer junior
 * 
 * Usage:
 *   npx tsx scripts/seed-frontend-junior-profile.ts <user_email>
 * 
 * Example:
 *   npx tsx scripts/seed-frontend-junior-profile.ts user@example.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedFrontendJuniorProfile(userEmail: string) {
  try {
    console.log(`Mencari user dengan email: ${userEmail}`);

    // Cari atau buat user
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log("User tidak ditemukan. Membuat user baru...");
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: "Frontend Developer Junior",
        },
      });
      console.log(`User baru dibuat dengan ID: ${user.id}`);
    } else {
      console.log(`User ditemukan dengan ID: ${user.id}`);
    }

    const userId = user.id;

    // 1. Skills - Frontend Developer Junior
    console.log("\n=== Mengisi Skills ===");
    const frontendSkills = [
      { name: "HTML", level: 75 },
      { name: "CSS", level: 70 },
      { name: "JavaScript", level: 70 },
      { name: "React", level: 65 },
      { name: "TypeScript", level: 60 },
      { name: "Tailwind CSS", level: 65 },
      { name: "Git", level: 60 },
      { name: "Responsive Design", level: 70 },
      { name: "REST API", level: 55 },
      { name: "Node.js", level: 50 },
      { name: "Next.js", level: 60 },
      { name: "Figma", level: 55 },
    ];

    // Hapus skills lama jika ada
    await prisma.userSkill.deleteMany({
      where: { userId },
    });

    // Tambahkan skills baru
    for (const skill of frontendSkills) {
      await prisma.userSkill.create({
        data: {
          userId,
          skillName: skill.name,
          level: skill.level,
        },
      });
      console.log(`✓ Skill ditambahkan: ${skill.name} (Level: ${skill.level})`);
    }

    // 2. Education
    console.log("\n=== Mengisi Education ===");
    await prisma.userEducation.deleteMany({
      where: { userId },
    });

    const education = await prisma.userEducation.create({
      data: {
        userId,
        school: "Universitas Indonesia",
        degree: "Sarjana",
        field: "Teknik Informatika",
        startDate: new Date("2018-09-01"),
        endDate: new Date("2022-07-31"),
        current: false,
        description: "Fokus pada pengembangan web dan software engineering. Mengikuti berbagai workshop dan bootcamp frontend development.",
      },
    });
    console.log(`✓ Education ditambahkan: ${education.school}`);

    // 3. Experience - Internship atau Junior Position
    console.log("\n=== Mengisi Experience ===");
    await prisma.userExperience.deleteMany({
      where: { userId },
    });

    const experiences = [
      {
        title: "Frontend Developer Intern",
        company: "PT Tech Startup Indonesia",
        location: "Jakarta, Indonesia",
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-06-30"),
        current: false,
        description: "Mengembangkan komponen React untuk aplikasi web perusahaan. Bekerja dengan tim untuk mengimplementasikan UI/UX design menggunakan Tailwind CSS. Meningkatkan performa aplikasi dengan optimasi rendering dan code splitting.",
      },
      {
        title: "Junior Frontend Developer",
        company: "PT Digital Solutions",
        location: "Jakarta, Indonesia",
        startDate: new Date("2022-07-01"),
        endDate: null,
        current: true,
        description: "Mengembangkan dan memelihara aplikasi web menggunakan React dan Next.js. Berkolaborasi dengan backend team untuk integrasi API. Menerapkan best practices untuk code quality dan testing. Membantu dalam code review dan mentoring intern.",
      },
    ];

    for (const exp of experiences) {
      const experience = await prisma.userExperience.create({
        data: {
          userId,
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current,
          description: exp.description,
        },
      });
      console.log(`✓ Experience ditambahkan: ${experience.title} di ${experience.company}`);
    }

    // 4. Projects
    console.log("\n=== Mengisi Projects ===");
    await prisma.userProject.deleteMany({
      where: { userId },
    });

    const projects = [
      {
        name: "E-Commerce Website",
        description: "Aplikasi e-commerce full-stack dengan React dan Node.js. Fitur: shopping cart, payment gateway integration, user authentication, dan admin dashboard. Menggunakan Redux untuk state management dan Stripe untuk payment.",
        startDate: new Date("2023-01-01"),
        endDate: new Date("2023-03-31"),
        url: "https://github.com/username/ecommerce-app",
      },
      {
        name: "Task Management App",
        description: "Aplikasi manajemen tugas dengan drag-and-drop functionality. Dibangun dengan React, TypeScript, dan Tailwind CSS. Fitur: real-time updates, team collaboration, dan notification system.",
        startDate: new Date("2023-04-01"),
        endDate: new Date("2023-06-30"),
        url: "https://github.com/username/task-manager",
      },
      {
        name: "Weather Dashboard",
        description: "Dashboard cuaca dengan visualisasi data menggunakan Chart.js. Mengintegrasikan API cuaca untuk menampilkan forecast dan historical data. Responsive design untuk mobile dan desktop.",
        startDate: new Date("2023-07-01"),
        endDate: new Date("2023-08-31"),
        url: "https://github.com/username/weather-dashboard",
      },
      {
        name: "Personal Portfolio Website",
        description: "Website portfolio pribadi dengan Next.js dan Framer Motion untuk animasi. Fitur: dark mode, blog section, dan contact form. SEO optimized dan performa tinggi dengan Lighthouse score 95+.",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2023-10-31"),
        url: "https://github.com/username/portfolio",
      },
    ];

    for (const project of projects) {
      const createdProject = await prisma.userProject.create({
        data: {
          userId,
          name: project.name,
          description: project.description,
          startDate: project.startDate,
          endDate: project.endDate,
          url: project.url,
        },
      });
      console.log(`✓ Project ditambahkan: ${createdProject.name}`);
    }

    // 5. Certifications
    console.log("\n=== Mengisi Certifications ===");
    await prisma.userCertification.deleteMany({
      where: { userId },
    });

    const certifications = [
      {
        name: "React - The Complete Guide",
        issuer: "Udemy",
        issueDate: new Date("2022-03-15"),
        expiryDate: null,
        credentialId: "UC-1234567890",
        url: "https://www.udemy.com/certificate/UC-1234567890/",
      },
      {
        name: "JavaScript Algorithms and Data Structures",
        issuer: "freeCodeCamp",
        issueDate: new Date("2022-05-20"),
        expiryDate: null,
        credentialId: "fcc-js-algorithms",
        url: "https://www.freecodecamp.org/certification/username/javascript-algorithms-and-data-structures",
      },
      {
        name: "Frontend Development Libraries",
        issuer: "freeCodeCamp",
        issueDate: new Date("2022-08-10"),
        expiryDate: null,
        credentialId: "fcc-frontend-libs",
        url: "https://www.freecodecamp.org/certification/username/front-end-development-libraries",
      },
    ];

    for (const cert of certifications) {
      const certification = await prisma.userCertification.create({
        data: {
          userId,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          credentialId: cert.credentialId,
          url: cert.url,
        },
      });
      console.log(`✓ Certification ditambahkan: ${certification.name} dari ${certification.issuer}`);
    }

    console.log("\n=== Seeding Selesai ===");
    console.log(`✓ Skills: ${frontendSkills.length}`);
    console.log(`✓ Education: 1`);
    console.log(`✓ Experiences: ${experiences.length}`);
    console.log(`✓ Projects: ${projects.length}`);
    console.log(`✓ Certifications: ${certifications.length}`);

  } catch (error: unknown) {
    console.error("Error seeding profile:", error);
    throw error;
  }
}

// Main execution
const userEmail = process.argv[2];
if (!userEmail) {
  console.error("Usage: npx tsx scripts/seed-frontend-junior-profile.ts <user_email>");
  console.error('Example: npx tsx scripts/seed-frontend-junior-profile.ts user@example.com');
  process.exit(1);
}

seedFrontendJuniorProfile(userEmail)
  .then(() => {
    console.log("\nSeeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

