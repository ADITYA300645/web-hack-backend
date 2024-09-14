
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  githubId: {
    type: String,
    required: true,
    // unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
  profileUrl: {
    type: String,
  },
  accessToken: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
  },
  email: {
    type: String,
  },
  repo_data: {
    type: String,
  }
},{timestamps : true});

// Create and export the User model
export const User = mongoose.model('User', userSchema);
