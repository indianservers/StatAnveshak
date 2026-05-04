export type ComputingModuleKey =
  | 'cryptography'
  | 'sorting'
  | 'searching'
  | 'hashing'
  | 'data_structures'
  | 'graphs'
  | 'dynamic_programming'
  | 'complexity'

export type ComputingModule = {
  key: ComputingModuleKey
  title: string
  category: string
  purpose: string
  concepts: string[]
  steps: string[]
}

export const COMPUTING_MODULES: ComputingModule[] = [
  {
    key: 'cryptography',
    title: 'Cryptography',
    category: 'Security',
    purpose: 'Teach encryption, decryption, hashing, keys, and why secure systems avoid home-made ciphers.',
    concepts: ['Plaintext and ciphertext', 'Symmetric key idea', 'Caesar cipher demo', 'SHA-256 digest', 'Avalanche effect'],
    steps: ['Enter a message.', 'Choose a Caesar shift.', 'Compare encrypted and decrypted text.', 'Check the SHA-256 digest.', 'Change one character and notice the digest changes completely.'],
  },
  {
    key: 'sorting',
    title: 'Sorting',
    category: 'Algorithms',
    purpose: 'Teach how algorithms reorder data and why different strategies have different time costs.',
    concepts: ['Comparison count', 'Bubble sort', 'Insertion sort', 'Merge sort', 'Quick sort', 'Stability'],
    steps: ['Enter comma-separated numbers.', 'Choose an algorithm.', 'Run sort.', 'Read sorted output, comparisons, and step trace.', 'Compare algorithms on the same input.'],
  },
  {
    key: 'searching',
    title: 'Searching',
    category: 'Algorithms',
    purpose: 'Teach how to find a target in data, and why binary search requires sorted input.',
    concepts: ['Linear search', 'Binary search', 'Target', 'Index', 'Best/average/worst case'],
    steps: ['Enter comma-separated numbers.', 'Enter a target value.', 'Run linear search on original order.', 'Run binary search on sorted values.', 'Compare checks needed.'],
  },
  {
    key: 'hashing',
    title: 'Hashing',
    category: 'Data Systems',
    purpose: 'Teach fast lookup, hash buckets, collisions, and why hashes are useful in tables and integrity checks.',
    concepts: ['Hash function', 'Bucket', 'Collision', 'Load factor', 'Lookup'],
    steps: ['Enter words or numbers.', 'Map each value to a bucket.', 'Inspect collisions.', 'Change bucket count.', 'Discuss lookup speed versus collision risk.'],
  },
  {
    key: 'data_structures',
    title: 'Data Structures',
    category: 'Foundations',
    purpose: 'Teach how arrays, stacks, queues, maps, and sets organize data for different operations.',
    concepts: ['Array', 'Stack', 'Queue', 'Set', 'Map', 'Operation cost'],
    steps: ['Choose a structure.', 'Add values.', 'Run push/pop/enqueue/dequeue/lookup.', 'Watch state change.', 'Compare operation complexity.'],
  },
  {
    key: 'graphs',
    title: 'Graph Algorithms',
    category: 'Algorithms',
    purpose: 'Teach nodes, edges, traversal, shortest paths, and network-style reasoning.',
    concepts: ['Node', 'Edge', 'BFS', 'DFS', 'Shortest path', 'Connected components'],
    steps: ['Use the sample graph.', 'Pick a start node.', 'Run BFS and DFS.', 'Compare visit order.', 'Use the order to reason about reachability.'],
  },
  {
    key: 'dynamic_programming',
    title: 'Dynamic Programming',
    category: 'Algorithms',
    purpose: 'Teach breaking problems into reusable subproblems to avoid repeated work.',
    concepts: ['Subproblem', 'Memoization', 'Tabulation', 'Fibonacci', 'Optimal substructure'],
    steps: ['Choose n.', 'Run recursive and dynamic versions.', 'Compare call count.', 'Inspect the table.', 'Generalize to optimization problems.'],
  },
  {
    key: 'complexity',
    title: 'Algorithm Complexity',
    category: 'Theory',
    purpose: 'Teach Big-O growth and how input size changes runtime expectations.',
    concepts: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n^2)', 'Tradeoffs'],
    steps: ['Choose n.', 'Compare growth functions.', 'Relate growth to sorting/searching modules.', 'Discuss when constants matter.', 'Use complexity before selecting an algorithm.'],
  },
]

export const COMPUTING_MODULE_BY_KEY = Object.fromEntries(COMPUTING_MODULES.map((module) => [module.key, module])) as Record<ComputingModuleKey, ComputingModule>
