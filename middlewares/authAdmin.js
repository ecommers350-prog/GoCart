import { clerkClient } from "@clerk/nextjs/server";

const authAdmin = async (userOrId) => {
    try {
        // If caller didn't provide a user or id, try to use USER_EMAIL from env
        if (!userOrId) {
            const envUserEmail = (process.env.USER_EMAIL || "").split(",").map(s => s.trim()).find(Boolean);
            if (!envUserEmail) return false;
            userOrId = envUserEmail;
        }

        let userObj = null;

        // If the caller passed a full user object (from currentUser()), use it directly
        if (typeof userOrId === "object") {
            userObj = userOrId;
        } else if (typeof userOrId === "string") {
            // If it's an email string, use it directly
            if (userOrId.includes("@")) {
                userObj = { email: userOrId };
            } else {
                // Fallback: try to fetch the user via clerkClient if only an id was provided
                if (clerkClient && clerkClient.users && typeof clerkClient.users.getUser === "function") {
                    userObj = await clerkClient.users.getUser(userOrId);
                } else {
                    // cannot resolve user; treat as non-admin
                    return false;
                }
            }
        } else {
            return false;
        }

        const adminEnv = process.env.ADMIN_EMAIL || "";
        // Normalize admin emails; strip accidental prefixes like 'user.' and lower-case
        const adminEmails = adminEnv
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .map((e) => e.replace(/^user\./i, ""))
            .filter(Boolean);

        const toEmail = (val) => {
            if (!val) return null;
            if (typeof val === "string") {
                const s = val.trim();
                return s.includes("@") ? s.toLowerCase() : null;
            }
            if (typeof val === "object") {
                if (typeof val.emailAddress === "string" && val.emailAddress.includes("@")) return val.emailAddress.toLowerCase();
                if (typeof val.email === "string" && val.email.includes("@")) return val.email.toLowerCase();
                if (typeof val.primaryEmailAddress === "string" && val.primaryEmailAddress.includes("@")) return val.primaryEmailAddress.toLowerCase();
            }
            return null;
        };

        // Collect candidate emails from various Clerk user shapes
        const candidateEmails = new Set();
        const candidates = [userObj?.email, userObj?.emailAddress, userObj?.primaryEmailAddress];
        for (const c of candidates) {
            const em = toEmail(c);
            if (em) candidateEmails.add(em);
        }

        if (Array.isArray(userObj?.emailAddresses)) {
            for (const e of userObj.emailAddresses) {
                const em = toEmail(e);
                if (em) candidateEmails.add(em);
            }
        }

        // Also check Clerk public metadata role if present
        const role = userObj?.publicMetadata?.role || userObj?.unsafeMetadata?.role || null;
        if (role && String(role).toLowerCase() === "admin") return true;

        // Debugging log (server-side) to help understand why an account isn't matched
        console.debug("authAdmin: candidateEmails=", Array.from(candidateEmails), "adminEmails=", adminEmails, "role=", role);

        // If any candidate email matches admin list, user is admin
        for (const em of candidateEmails) {
            if (adminEmails.includes(em)) return true;
        }

        return false;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export default authAdmin;