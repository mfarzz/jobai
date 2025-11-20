import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const educationSchema = z.object({
  school: z.string().min(1).max(200),
  degree: z.string().max(150).optional(),
  field: z.string().max(150).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  current: z.boolean().default(false),
  description: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educations = await prisma.userEducation.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json(educations);
  } catch (error) {
    console.error("Error fetching educations:", error);
    return NextResponse.json(
      { error: "Failed to fetch educations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = educationSchema.parse(body);

    const education = await prisma.userEducation.create({
      data: {
        userId: session.user.id,
        school: validatedData.school,
        degree: validatedData.degree,
        field: validatedData.field,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        current: validatedData.current,
        description: validatedData.description,
      },
    });

    return NextResponse.json(education, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating education:", error);
    return NextResponse.json(
      { error: "Failed to create education" },
      { status: 500 }
    );
  }
}

