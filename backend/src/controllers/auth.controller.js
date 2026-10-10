const User = require("../models/User");
const Participant = require("../models/Participant");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { signToken } = require("../middleware/auth");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { email, password, role = "participant", name, walletAddress, participantRole = "Manufacturer", location } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists.", "EmailTaken");
  }

  const displayName = name?.trim() || email.split("@")[0];
  const userRole = role === "admin" ? "admin" : "participant";

  let participantDoc = null;

  if (userRole === "participant" && walletAddress && walletAddress.trim()) {
    const cleanWallet = walletAddress.trim();
    const existingWallet = await Participant.findOne({ walletAddress: cleanWallet });
    if (existingWallet && existingWallet.user) {
      throw ApiError.conflict("This wallet address is already linked to another participant account.", "WalletTaken");
    }

    participantDoc = await Participant.findOneAndUpdate(
      { walletAddress: cleanWallet },
      {
        $set: {
          name: displayName,
          role: participantRole || "Manufacturer",
          location: location?.trim() || "",
          active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const user = await User.create({
    name: displayName,
    email: email.trim().toLowerCase(),
    password,
    role: userRole,
    participant: participantDoc ? participantDoc._id : null,
    active: true,
  });

  if (participantDoc) {
    participantDoc.user = user._id;
    await participantDoc.save();
  }

  const token = signToken(user);
  const populatedUser = await User.findById(user._id).populate("participant");

  res.status(201).json({
    success: true,
    data: {
      token,
      user: formatUser(populatedUser || user),
      message: "Account created successfully.",
    },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password").populate("participant");

  // same message for wrong email and wrong password
  if (!user || !(await user.checkPassword(password))) {
    throw ApiError.unauthorized("Incorrect email or password.", "InvalidCredentials");
  }
  if (!user.active) throw ApiError.forbidden("Your account is disabled.", "AccountDisabled");
  if (user.role === "participant" && user.participant && !user.participant.active) {
    throw ApiError.forbidden("Your organisation's access is disabled. Contact the admin.", "ParticipantDisabled");
  }

  user.lastLoginAt = new Date();
  await user.save();

  res.json({ success: true, data: { token: signToken(user), user: formatUser(user) } });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// PATCH /api/auth/profile — update only self-owned profile fields, never roles/access
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("participant");
  if (!user) throw ApiError.notFound("Account not found.");

  if (req.body.name !== undefined) user.name = req.body.name;
  await user.save();

  if (user.participant) {
    if (req.body.location !== undefined) user.participant.location = req.body.location;
    if (req.body.contactPhone !== undefined) user.participant.contactPhone = req.body.contactPhone;
    await user.participant.save();
  }

  res.json({ success: true, data: { user: formatUser(user) } });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.checkPassword(req.body.currentPassword))) {
    throw ApiError.badRequest("Current password is incorrect.", "InvalidCredentials");
  }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, data: { message: "Password changed." } });
});

function formatUser(user) {
  const p = user.participant;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    participant: p
      ? {
          id: String(p._id),
          name: p.name,
          role: p.role,
          walletAddress: p.walletAddress,
          active: p.active,
          location: p.location,
          contactPhone: p.contactPhone,
        }
      : null,
  };
}

module.exports = { register, login, me, updateProfile, changePassword };