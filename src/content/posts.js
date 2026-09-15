export const posts = [
  {
    slug: 'production-readiness-is-a-design-problem',
    title: 'Production readiness is a design problem',
    date: '2026-09-14',
    readTime: '7 min read',
    tag: 'Reliability',
    excerpt:
      'SLOs, runbooks, alert quality, and the small operational habits that keep teams calm when systems get loud.',
    sections: [
      {
        heading: 'Readiness is more than a checklist',
        body:
          'A service can pass deployment checks and still be difficult to operate. The useful question is whether a team can understand, debug, scale, and safely recover the service when the happy path disappears.',
      },
      {
        heading: 'The operating shape I look for',
        body:
          'Good readiness shows up as clear ownership, useful dashboards, actionable alerts, tested rollback paths, dependency maps, and runbooks that explain decisions instead of copying terminal commands.',
      },
      {
        heading: 'What changes engineering behavior',
        body:
          'SLOs and error budgets work when they are connected to release decisions. If reliability data cannot influence prioritization, it becomes a reporting artifact rather than an engineering tool.',
      },
    ],
  },
  {
    slug: 'building-fabricops-under-lfdt',
    title: 'Building FabricOps under LFDT',
    date: '2026-09-14',
    readTime: '6 min read',
    tag: 'Open Source',
    excerpt:
      'What a Kubernetes operator teaches you about reconciliation, platform abstractions, and real-world infrastructure.',
    sections: [
      {
        heading: 'Operators are promises',
        body:
          'A Kubernetes operator is not just automation. It is a promise that declared state and real state will keep finding their way back to each other, even when systems are interrupted.',
      },
      {
        heading: 'Why Fabric needs operational care',
        body:
          'Hyperledger Fabric networks have certificates, channels, chaincode, peers, ordering services, and lifecycle steps that need careful coordination. FabricOps exists to make that operational surface easier to manage.',
      },
      {
        heading: 'The work ahead',
        body:
          'The interesting work is in safer reconciliation, clearer status reporting, better defaults, and making failure modes understandable for teams running production blockchain infrastructure.',
      },
    ],
  },
  {
    slug: 'reporting-without-hurting-live-databases',
    title: 'Reporting without hurting live databases',
    date: '2026-09-14',
    readTime: '5 min read',
    tag: 'Data Infrastructure',
    excerpt:
      'A CDC pattern for streaming operational data into ClickHouse so reporting reads stay away from production paths.',
    sections: [
      {
        heading: 'The production problem',
        body:
          'Admin reporting can become invisible load on a live transactional database. The work may look harmless until long-running reads, dashboard refreshes, or ad hoc exports start competing with user-facing paths.',
      },
      {
        heading: 'The pipeline shape',
        body:
          'I used change data capture with continuous replication from RDS into ClickHouse, giving administrators a reporting store optimized for analytical reads without pulling heavy queries through the primary database.',
      },
      {
        heading: 'Reliability considerations',
        body:
          'The important parts were lag visibility, replay behavior, schema-change handling, and clear ownership of the pipeline so reporting stayed useful without becoming a hidden production risk.',
      },
    ],
  },
];

export function getPost(slug) {
  return posts.find((post) => post.slug === slug);
}
