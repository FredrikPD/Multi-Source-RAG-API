flowchart TD
    %% === External Actors ===
    User[(User / Client)]
    LLMAPI[(External LLM API)]
    DB[(Primary DB)]
    VectorDB[(Vector Store)]

    %% === Entry Point ===
    User -->|HTTP / Websocket| Server

    subgraph App[Node.js Application (src)]
        direction TB

        Server[server.js\n- Bootstrap app\n- Load env\n- Register routes]

        subgraph Config[config/]
            Env[env.js\n- Load environment variables\n- Config objects]
        end

        subgraph Routes[routes/]
            ChatRoutes[chat.js]
            IngestRoutes[ingest.js]
            SessionRoutes[sessions.js]
        end

        subgraph Controllers[controllers/]
            ChatController[chatController.js]
            IngestController[ingestController.js]
            SessionController[sessionController.js]
        end

        subgraph Services[services/]
            ChatService[chatService.js]
            VectorStore[vectorStore.js]
            Embeddings[embeddings.js]
            TextChunker[textChunker.js]

            subgraph Ingestion[services/ingestion/]
                IngestService[ingestService.js]
                PDFParser[pdfParser.js]
                CSVParser[csvParser.js]
                DocxParser[docxParser.js]
                JSONParser[jsonParser.js]
            end
        end

        subgraph LLM[llm/]
            LLMClient[llmClient.js]
            Followup[followup.js]
        end

        subgraph DBLayer[db/]
            DBClient[client.js]
        end
    end

    %% === Wiring inside the app ===

    %% server + routes + controllers
    Server --> Env
    Server --> Routes
    Routes --> ChatController
    Routes --> IngestController
    Routes --> SessionController

    %% controllers -> services
    ChatController --> ChatService
    ChatController --> SessionController
    IngestController --> IngestService
    SessionController --> DBClient

    %% services composition
    ChatService --> Embeddings
    ChatService --> VectorStore
    ChatService --> LLMClient
    ChatService --> Followup

    IngestService --> PDFParser
    IngestService --> CSVParser
    IngestService --> DocxParser
    IngestService --> JSONParser
    IngestService --> TextChunker
    IngestService --> Embeddings
    IngestService --> VectorStore

    %% db + external deps
    VectorStore --> VectorDB
    DBClient --> DB
    LLMClient --> LLMAPI