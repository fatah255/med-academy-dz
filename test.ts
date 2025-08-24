import axios from "axios";
const request = {
  apiKey: "AIzaSyCmrAHiw3eRL8hmZb-OUKmKmacnTiINw-A",
  authDomain: "bmset.com",
  projectId: "bmset-85f8a",
  storageBucket: "bmset-85f8a.appspot.com",
  messagingSenderId: "1034461988294",
  appId: "1:1034461988294:web:8b84a357558a07d4c5dec7",
};

const baseUrl = "https://us-central1-bmset-85f8a.cloudfunctions.net/api/";

const bmset = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${request.apiKey}`,
  },
});

console.log(await bmset.get("/quiz"));
