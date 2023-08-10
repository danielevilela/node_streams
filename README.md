![](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

# Processing 1 Million SQL Rows to CSV using Node.js Streams

In the realm of computing, there are instances where the data we deal with is immense, surpassing the limitations of immediate memory storage. This is where streams come to the rescue: they empower us to manipulate data in smaller fragments.

In this example, we'll be working with three specific types of streams: Readable, Transform, and Writable. And based on a Postgres query, we are going to manipulate and save 1 million rows in a csv file

## Executing the project

```javascript
yarn
yarn start
```

<br/>

# Specifications

### 1. Creating a Database Pool

We set up a function to create a database connection pool using the `pg` package. This connection pool will enable us to manage and handle database connections.

```javascript
import pg from "pg";

export function createDatabasePool() {
  try {
    const connectionString = `postgres://${USER}:${PASSWORD}@localhost:5432/postgres`;
    const pool = new pg.Pool({ connectionString });
    return pool;
  } catch (error) {
    console.error("Error creating database pool:", error);
    throw error;
  }
}
```

### 2. Configuring Streams

We create three types of streams to accomplish our task: a Readable stream to fetch data from the database, a Transform stream to process and format the data, and a Writable stream to save the processed data to a CSV file.

To create a readable stream, you need the package
[`pg-query-stream`](https://github.com/brianc/node-postgres/tree/master/packages/pg-query-stream), which will receive result rows from pg as a readable (object) stream.

#### Readable Stream

The stream uses a cursor on the server so it keeps only a low number of rows in memory, the cursor size is defined by the variable `batchSize`

```javascript
const queryStream = new QueryStream(
  "SELECT * FROM generate_series(0, $1) num",
  [1000000],
  { batchSize: 1000 }
);
```

#### Transform Stream

Because we receive an object, we need to transform the data before adding it to the file.

```javascript
const transformStream = new Transform({
  objectMode: true,
  transform(row, encoding, callback) {
    row.description = `Row ${row.num}`;
    row.date = new Date().toString();
    callback(null, `${row.num}, ${row.description}, ${row.date}` + "\n");
  },
});
```

#### Writable Stream

In this case, we are writing data to a file

```javascript
const fileWriteStream = fileStream.createWriteStream("output.csv");
```

### Starting the Data Flow

With the streams configured, we define a function called startStream that initiates the data flow process. Inside this function, we establish a connection to the database using the connection pool and create a query stream from the provided SQL query.

```javascript
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
```

Explanation:

`stream.pipe(transformStream)`: connects the query stream to the transform stream. This means that data retrieved from the database will be passed through the transformStream for processing.

`transformStream.pipe(writeStream)`: connects the transform stream to the write stream. Processed data from the transform stream is then written to the specified file using the writeStream.

`.on("error", console.error)`: attaches an error event listener to the pipeline. If an error occurs at any stage, it will be logged to the console.

`.on("finish", () => {...})`: attaches a finish event listener to the pipeline. When the entire process of streaming, transforming, and writing is completed, this function will be executed.

Inside the finish event listener, a timestamp is logged using `console.log("FINISHED: ", new Date())`, marking the completion of the data processing.

`done()` is called to release the database client back to the pool, indicating that it's available for reuse.

Finally, the startStream function is invoked with transformStream and fileWriteStream as arguments, effectively starting the entire data processing and writing pipeline.

### Visualizing the Process

For a visual representation of the process, take a look at the the terminal:

```bash
$ node streams.js
STARTED  2023-08-10T05:33:06.521Z
FINISHED:  2023-08-10T05:33:24.567Z
Done in 28.70s.
```

Also a new file with the name `output.csv` will be created with 1 million transformed rows !

# Conclusion

In this exercise, we've explored the power of Node.js streams and their ability to handle large amounts of data efficiently. We've learned how to use Readable, Transform, and Writable streams to read data from a PostgreSQL database, process it, and save it as a CSV file.<br/>
By breaking down the data processing into smaller chunks, we can conserve memory and improve the overall performance of our application.<br/>
Feel free to explore the code, experiment with different settings, and adapt it to your own projects. Happy coding!
