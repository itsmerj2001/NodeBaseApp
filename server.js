const app = require("./app");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
mongoose
  .connect(process.env.DB)
  .then((con) => console.log(`DB connected successfully`));

app.listen(process.env.PORT, () => {
  console.log("app listening");
});
