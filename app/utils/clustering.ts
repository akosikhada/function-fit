export interface DataPoint {
  id: string;
  features: number[];
  name?: string;
}

export interface Cluster {
  centroid: number[];
  points: DataPoint[];
}

// Calculate Euclidean distance between two points
const euclideanDistance = (a: number[], b: number[]): number => {
  if (a.length !== b.length) throw new Error("Vectors must be of same length");
  return Math.sqrt(a.reduce((sum, _, i) => sum + Math.pow(a[i] - b[i], 2), 0));
};

// Find the closest centroid for a data point
const findClosestCentroid = (
  point: DataPoint,
  centroids: number[][]
): number => {
  let minDistance = Infinity;
  let closestCentroidIndex = 0;

  centroids.forEach((centroid, index) => {
    const distance = euclideanDistance(point.features, centroid);
    if (distance < minDistance) {
      minDistance = distance;
      closestCentroidIndex = index;
    }
  });

  return closestCentroidIndex;
};

// Calculate the mean point of a cluster
const calculateCentroid = (points: DataPoint[]): number[] => {
  if (points.length === 0) return [];

  const dimensions = points[0].features.length;
  const centroid = new Array(dimensions).fill(0);

  points.forEach((point) => {
    point.features.forEach((value, index) => {
      centroid[index] += value;
    });
  });

  return centroid.map((sum) => sum / points.length);
};

// Check if centroids have converged
const centroidsConverged = (
  oldCentroids: number[][],
  newCentroids: number[][],
  threshold = 0.001
): boolean => {
  return oldCentroids.every(
    (centroid, i) => euclideanDistance(centroid, newCentroids[i]) < threshold
  );
};

// Main K-means function
export const kMeansClustering = (
  dataPoints: DataPoint[],
  k: number,
  maxIterations = 100 // 100 iterations is a good default
): Cluster[] => {
  if (dataPoints.length === 0) return [];
  if (k <= 0) throw new Error("k must be a positive integer");
  if (k > dataPoints.length) k = dataPoints.length;

  const dimensions = dataPoints[0].features.length; // Ensure all points have the same number of dimensions

  // Initialize random centroids by picking k random data points
  let centroids: number[][] = [];
  const usedIndices = new Set<number>();

  while (centroids.length < k) {
    const randomIndex = Math.floor(Math.random() * dataPoints.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      centroids.push([...dataPoints[randomIndex].features]); // Create a copy
    }
  }

  // Initialize clusters
  // Each cluster will have a centroid and an array of points
  let clusters: Cluster[] = new Array(k).fill(null).map(() => ({
    centroid: [],
    points: [],
  }));

  let iterations = 0;
  let converged = false;

  while (!converged && iterations < maxIterations) {
    // Reset clusters, keeping centroids
    clusters = clusters.map((cluster) => ({
      centroid: cluster.centroid,
      points: [],
    }));

    // Assign each point to nearest centroid
    dataPoints.forEach((point) => {
      const clusterIndex = findClosestCentroid(point, centroids);
      clusters[clusterIndex].points.push(point);
    });

    // Calculate new centroids
    const newCentroids = clusters.map((cluster) =>
      cluster.points.length > 0
        ? calculateCentroid(cluster.points)
        : new Array(dimensions).fill(0)
    );

    // Check for convergence
    if (iterations > 0) {
      converged = centroidsConverged(centroids, newCentroids);
    }

    centroids = newCentroids;
    iterations++;

    // Update cluster centroids
    clusters.forEach((cluster, i) => {
      cluster.centroid = centroids[i];
    });
  }

  return clusters;
};

// Normalize data to improve clustering quality
export const normalizeFeatures = (dataPoints: DataPoint[]): DataPoint[] => {
  if (dataPoints.length === 0) return [];

  const dimensions = dataPoints[0].features.length;
  const mins = new Array(dimensions).fill(Infinity);
  const maxs = new Array(dimensions).fill(-Infinity);

  // Find min and max for each dimension
  dataPoints.forEach((point) => {
    point.features.forEach((value, index) => {
      mins[index] = Math.min(mins[index], value);
      maxs[index] = Math.max(maxs[index], value);
    });
  });

  // Normalize each point
  return dataPoints.map((point) => ({
    ...point,
    features: point.features.map((value, index) => {
      // If max = min, return 0.5 to avoid division by zero
      if (maxs[index] === mins[index]) return 0.5;
      return (value - mins[index]) / (maxs[index] - mins[index]);
    }),
  }));
};
