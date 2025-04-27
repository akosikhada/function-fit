// Simple test for Supabase connectivity
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config();

// Use the API keys from the .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log("Testing Supabase connection...");

    // Try a simple query
    const { data, error } = await supabase
      .from("workouts")
      .select("id, title")
      .limit(1);

    if (error) {
      console.error("Error connecting to Supabase:", error);
      return;
    }

    console.log("Connection successful!");
    console.log("Sample data:", data);
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

// Run the test
testConnection();
