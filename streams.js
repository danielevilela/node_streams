import QueryStream from "pg-query-stream";
import { Transform } from "stream";
import fileStream from "fs";
import { createDatabasePool } from "./database.js";

const pool = createDatabasePool();

const queryStream = new QueryStream(
  "SELECT * FROM generate_series(0, $1) num",
  [1000000],
  { batchSize: 1000 }
);

//Transform Stream:  stream to string

const transformStream = new Transform({
  objectMode: true,
  transform(row, encoding, callback) {
    row.description = `Row ${row.num}`;
    row.date = new Date().toString();
    callback(null, `${row.num}, ${row.description}, ${row.date}` + "\n");
  },
});

// Writeable Stream:  stream to file
const fileWriteStream = fileStream.createWriteStream("output.csv");

const startStream = (transformStream, writeStream) => {
  console.log("STARTED ", new Date());
  pool.connect((err, client, done) => {
    if (err) console.error(err);

    const stream = client.query(queryStream);

    stream
      .pipe(transformStream)
      .pipe(writeStream)
      .on("error", console.error)
      .on("finish", () => {
        console.log("FINISHED: ", new Date());
        done();
      });
  });
};

startStream(transformStream, fileWriteStream);
