const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Format d'email invalide"],
    },
    password: {
      type: String,
      // pas de mot de passe obligatoire pour les comptes créés via Google ou GitHub
      required: function () {
        return !this.googleId && !this.githubId;
      },
      minlength: [8, "Le mot de passe doit contenir au moins 8 caractères"],
      maxlength: [72, "Le mot de passe ne peut pas dépasser 72 caractères"], // limite de bcrypt
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // permet à googleId d'être absent pour les utilisateurs non-Google
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true, // permet à githubId d'être absent pour les utilisateurs non-GitHub
    },
  },
  {
    timestamps: true,
  },
);

// Hash du mot de passe avant sauvegarde
// (la validation minlength/maxlength s'exécute avant, sur le mot de passe en clair)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Méthode de comparaison du mot de passe
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Ne jamais exposer le hash ni les identifiants des fournisseurs dans les réponses JSON
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.googleId;
    delete ret.githubId;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);