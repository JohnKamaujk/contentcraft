import { sendWelcomeEmail } from "../mailtrap";
import { db } from "./dbConfig";
import { Users, Subscriptions, GeneratedContent } from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";

export async function createOrUpdateUser(
  clerkUserId: string,
  email: string,
  name: string
) {
  try {
    console.log("Creating or updating user:", clerkUserId, email, name);

    const [existingUser] = await db
      .select()
      .from(Users)
      .where(eq(Users.stripeCustomerId, clerkUserId))
      .limit(1)
      .execute();

    if (existingUser) {
      const [updatedUser] = await db
        .update(Users)
        .set({ name, email })
        .where(eq(Users.stripeCustomerId, clerkUserId))
        .returning()
        .execute();
      console.log("Updated user:", updatedUser);
      return updatedUser;
    }

    const [userWithEmail] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .limit(1)
      .execute();

    if (userWithEmail) {
      const [updatedUser] = await db
        .update(Users)
        .set({ name, stripeCustomerId: clerkUserId })
        .where(eq(Users.email, email))
        .returning()
        .execute();
      console.log("Updated user:", updatedUser);
      sendWelcomeEmail(email, name);
      return updatedUser;
    }

    const [newUser] = await db
      .insert(Users)
      .values({ email, name, stripeCustomerId: clerkUserId, points: 50 })
      .returning()
      .execute();
    console.log("New user created:", newUser);
    sendWelcomeEmail(email, name);
    return newUser;
  } catch (error) {
    console.error("Error creating or updating user:", error);
    return null;
  }
}

export async function createOrUpdateSubscription(
  userId: string,
  stripeSubscriptionId: string,
  plan: string,
  status: string,
  currentPeriodStart: Date,
  currentPeriodEnd: Date
) {
  try {
    const [user] = await db
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.stripeCustomerId, userId))
      .limit(1);

    if (!user) {
      console.error(`No user found with stripeCustomerId: ${userId}`);
      return null;
    }

    const existingSubscription = await db
      .select()
      .from(Subscriptions)
      .where(eq(Subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    let subscription;
    if (existingSubscription.length > 0) {
      // Update existing subscription
      [subscription] = await db
        .update(Subscriptions)
        .set({
          plan,
          status,
          currentPeriodStart,
          currentPeriodEnd,
        })
        .where(eq(Subscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .returning()
        .execute();
    } else {
      [subscription] = await db
        .insert(Subscriptions)
        .values({
          userId: user.id,
          stripeSubscriptionId,
          plan,
          status,
          currentPeriodStart,
          currentPeriodEnd,
        })
        .returning()
        .execute();
    }

    console.log("Subscription created or updated:", subscription);
    return subscription;
  } catch (error) {
    console.error("Error creating or updating subscription:", error);
    return null;
  }
}
