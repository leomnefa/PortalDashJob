export const SCHEMA_STATEMENTS: string[] = [
  `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Job]') AND type = 'U')
  CREATE TABLE [dbo].[Job] (
    id               NVARCHAR(200)   NOT NULL PRIMARY KEY,
    source           NVARCHAR(100)   NOT NULL,
    sourceJobId      NVARCHAR(200)   NOT NULL,
    title            NVARCHAR(400)   NOT NULL,
    company          NVARCHAR(400)   NOT NULL,
    url              NVARCHAR(1000)  NOT NULL,
    location         NVARCHAR(400)   NULL,
    remote           BIT             NOT NULL,
    employmentType   NVARCHAR(50)    NULL,
    seniority        NVARCHAR(50)    NULL,
    salaryMin        FLOAT           NULL,
    salaryMax        FLOAT           NULL,
    salaryCurrency   NVARCHAR(10)    NULL,
    salaryPeriod     NVARCHAR(50)    NULL,
    tags             NVARCHAR(MAX)   NOT NULL DEFAULT '[]',
    description      NVARCHAR(MAX)   NOT NULL DEFAULT '',
    postedAt         DATETIME2       NULL,
    retrievedAt      DATETIME2       NOT NULL,
    applyMode        NVARCHAR(20)    NOT NULL,
    rawData          NVARCHAR(MAX)   NULL
  );`,
  `IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_Job_source_sourceJobId' AND object_id = OBJECT_ID(N'[dbo].[Job]'))
  CREATE UNIQUE INDEX UX_Job_source_sourceJobId ON [dbo].[Job] (source, sourceJobId);`,
  `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Application]') AND type = 'U')
  CREATE TABLE [dbo].[Application] (
    id               UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    jobId            NVARCHAR(200)    NOT NULL REFERENCES [dbo].[Job](id),
    status           NVARCHAR(30)     NOT NULL,
    cvText           NVARCHAR(MAX)    NULL,
    coverLetterText  NVARCHAR(MAX)    NULL,
    notes            NVARCHAR(MAX)    NULL,
    createdAt        DATETIME2        NOT NULL,
    updatedAt        DATETIME2        NOT NULL
  );`,
  `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApplicationEvent]') AND type = 'U')
  CREATE TABLE [dbo].[ApplicationEvent] (
    id               INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    applicationId    UNIQUEIDENTIFIER  NOT NULL REFERENCES [dbo].[Application](id),
    status           NVARCHAR(30)      NOT NULL,
    at               DATETIME2         NOT NULL
  );`,
];
