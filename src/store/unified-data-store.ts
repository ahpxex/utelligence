import type { ColumnVisualizableConfig } from "@/types/visualization";
import { analyzeColumnData, type FileData } from "@/utils/data/data-processing";
import { processFile } from "@/utils/data/file-upload/upload-utils";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { visualizationChartStore } from "./visualization-chart-store";

// Types
interface ParsedData {
	headers: string[];
	rows: string[][];
}

interface DuplicateGroup {
	key: string;
	indices: number[];
	rows: any[];
	count: number;
}

interface DuplicatesStatistics {
	totalRows: number;
	uniqueRows: number;
	duplicateRows: number;
	duplicateGroupsCount: number;
	duplicateCount: number;
}

interface OutliersMethodDetails {
	mean?: number;
	stdDev?: number;
	q1?: number;
	q3?: number;
	iqr?: number;
	lowerPercentile?: number;
	upperPercentile?: number;
}

interface OutliersStatistics {
	lowerBound: number;
	upperBound: number;
	method: string;
	threshold: number;
	outlierCount: number;
	totalCount: number;
	methodDetails: OutliersMethodDetails;
}

interface FileProfile {
	id: string;
	file: File | null;
	fileIdentifier: string | null;
	fileName: string;
	fileSize: number;
	rawData: ParsedData | null;
	processedData: { headers: string[]; rows: FileData } | null;
	cleanedData: { headers: string[]; rows: any[] } | null;
	columnAnalysis: ColumnVisualizableConfig[];
	duplicates: {
		selectedColumns: string[];
		groups: DuplicateGroup[];
		statistics: DuplicatesStatistics;
		activeTab: string;
		expandedGroup: string | null;
	};
	outliers: {
		columnName: string;
		method: string;
		threshold: number;
		statistics: OutliersStatistics;
		activeTab: string;
		chartData: any[];
	};
	createdAt: number;
}

/**
 * Unified Data Store Interface
 * Consolidates all data-related state management with multi-file profile support
 */
interface UnifiedDataState {
	// Profile Management
	profiles: Map<string, FileProfile>;
	activeProfileId: string | null;

	// Loading & Error States
	isLoading: boolean;
	error: string | null;

	// Computed getters (for backward compatibility)
	currentFile: File | null;
	currentFileIdentifier: string | null;
	rawData: ParsedData | null;
	processedData: { headers: string[]; rows: FileData } | null;
	cleanedData: { headers: string[]; rows: any[] } | null;
	columnAnalysis: ColumnVisualizableConfig[];
	duplicates: {
		selectedColumns: string[];
		groups: DuplicateGroup[];
		statistics: DuplicatesStatistics;
		activeTab: string;
		expandedGroup: string | null;
	};
	outliers: {
		columnName: string;
		method: string;
		threshold: number;
		statistics: OutliersStatistics;
		activeTab: string;
		chartData: any[];
	};

	// Actions - Profile Management
	createProfile: (file: File) => Promise<string>;
	switchProfile: (profileId: string) => void;
	deleteProfile: (profileId: string) => void;
	getProfileList: () => Array<{ id: string; fileName: string; createdAt: number }>;

	// Actions - File Management (updated for profile support)
	uploadFile: (file: File) => Promise<void>;
	clearFile: () => void;
	clearAllFiles: () => void;

	// Actions - Data Processing
	processAndAnalyze: (columnsToAnalyze: string[]) => Promise<void>;
	cleanData: (operationType: string, params: any) => Promise<void>;
	processMissingValues: (settings: {
		[key: string]: { strategy: string; value?: string | number };
	}, callbacks?: {
		onProgress?: (progress: number) => void;
		onComplete?: () => void;
		onError?: (error: string) => void;
	}) => Promise<void>;

	// Actions - Duplicates
	setDuplicatesColumns: (columns: string[]) => void;
	analyzeDuplicates: () => void;
	removeDuplicates: (indices: number[]) => void;

	// Actions - Outliers
	setOutliersColumn: (column: string) => void;
	setOutliersMethod: (method: string, threshold: number) => void;
	analyzeOutliers: () => void;
	removeOutliers: (indices: number[]) => void;

	// Actions - UI State
	setActiveTab: (section: "duplicates" | "outliers", tab: string) => void;
	setExpandedGroup: (groupId: string | null) => void;
}

/**
 * Unified Data Store
 * Single source of truth for all data operations
 */
const createDefaultProfile = (id: string, file: File | null = null, fileName: string = "", fileSize: number = 0): FileProfile => ({
	id,
	file,
	fileIdentifier: file ? `${file.name}-${file.size}` : null,
	fileName: file?.name || fileName,
	fileSize: file?.size || fileSize,
	rawData: null,
	processedData: null,
	cleanedData: null,
	columnAnalysis: [],
	duplicates: {
		selectedColumns: [],
		groups: [],
		statistics: {
			totalRows: 0,
			uniqueRows: 0,
			duplicateRows: 0,
			duplicateGroupsCount: 0,
			duplicateCount: 0,
		},
		activeTab: "summary",
		expandedGroup: null,
	},
	outliers: {
		columnName: "",
		method: "zscore",
		threshold: 3,
		statistics: {
			lowerBound: 0,
			upperBound: 0,
			method: "zscore",
			threshold: 3,
			outlierCount: 0,
			totalCount: 0,
			methodDetails: {},
		},
		activeTab: "chart",
		chartData: [],
	},
	createdAt: Date.now(),
});

export const useUnifiedDataStore = create<UnifiedDataState>()(
	persist(
		(set, get) => ({
			// Initial State
			profiles: new Map(),
			activeProfileId: null,
			isLoading: false,
			error: null,

			// Derived state (stored as regular properties, updated when profiles change)
			currentFile: null,
			currentFileIdentifier: null,
			rawData: null,
			processedData: null,
			cleanedData: null,
			columnAnalysis: [],
			duplicates: createDefaultProfile("").duplicates,
			outliers: createDefaultProfile("").outliers,

			// Profile Management Actions
			createProfile: async (file) => {
				const profileId = `${file.name}-${file.size}-${Date.now()}`;
				const newProfile = createDefaultProfile(profileId, file);

				set((state) => {
					const newProfiles = new Map(state.profiles);
					newProfiles.set(profileId, newProfile);
					return {
						profiles: newProfiles,
						activeProfileId: profileId,
						// Sync derived state
						currentFile: newProfile.file,
						currentFileIdentifier: newProfile.fileIdentifier,
						rawData: newProfile.rawData,
						processedData: newProfile.processedData,
						cleanedData: newProfile.cleanedData,
						columnAnalysis: newProfile.columnAnalysis,
						duplicates: newProfile.duplicates,
						outliers: newProfile.outliers,
					};
				});

				return profileId;
			},

		switchProfile: (profileId) => {
			const { profiles } = get();
			const profile = profiles.get(profileId);
			if (profile) {
				set({
					activeProfileId: profileId,
					// Sync derived state
					currentFile: profile.file,
					currentFileIdentifier: profile.fileIdentifier,
					rawData: profile.rawData,
					processedData: profile.processedData,
					cleanedData: profile.cleanedData,
					columnAnalysis: profile.columnAnalysis,
					duplicates: profile.duplicates,
					outliers: profile.outliers,
				});
				// Update visualization chart store with complete file context
				if (profile.fileIdentifier && profile.processedData?.headers && profile.columnAnalysis.length > 0) {
					visualizationChartStore.getState().initializeFileContext({
						identifier: profile.fileIdentifier,
						columns: profile.processedData.headers,
						columnStatus: profile.columnAnalysis,
					});
				} else if (profile.fileIdentifier) {
					// Fallback for profiles without processed data
					visualizationChartStore.getState().setCurrentFileIdentifier(profile.fileIdentifier);
				}
			}
		},

			deleteProfile: (profileId) => {
				set((state) => {
					const newProfiles = new Map(state.profiles);
					newProfiles.delete(profileId);

					let newActiveProfileId = state.activeProfileId;
					let updatedState: any = {
						profiles: newProfiles,
					};

					if (state.activeProfileId === profileId) {
						const remainingProfiles = Array.from(newProfiles.keys());
						newActiveProfileId = remainingProfiles.length > 0 ? remainingProfiles[0] : null;

						updatedState.activeProfileId = newActiveProfileId;

						// Sync derived state with new active profile
						if (newActiveProfileId) {
							const newActiveProfile = newProfiles.get(newActiveProfileId);
							if (newActiveProfile) {
								updatedState = {
									...updatedState,
									currentFile: newActiveProfile.file,
									currentFileIdentifier: newActiveProfile.fileIdentifier,
									rawData: newActiveProfile.rawData,
									processedData: newActiveProfile.processedData,
									cleanedData: newActiveProfile.cleanedData,
									columnAnalysis: newActiveProfile.columnAnalysis,
									duplicates: newActiveProfile.duplicates,
									outliers: newActiveProfile.outliers,
								};
							}
						} else {
							// No profiles left, reset to defaults
							const defaultProfile = createDefaultProfile("");
							updatedState = {
								...updatedState,
								currentFile: null,
								currentFileIdentifier: null,
								rawData: null,
								processedData: null,
								cleanedData: null,
								columnAnalysis: [],
								duplicates: defaultProfile.duplicates,
								outliers: defaultProfile.outliers,
							};
						}
					}

					return updatedState;
				});
			},

			getProfileList: () => {
				const { profiles } = get();
				return Array.from(profiles.values()).map(profile => ({
					id: profile.id,
					fileName: profile.file?.name ?? "Unknown",
					createdAt: profile.createdAt,
				}));
			},

			// File Management Actions
			uploadFile: async (file) => {
				const { profiles, activeProfileId } = get();
				const fileKey = `${file.name}-${file.size}`;

				// Check if profile already exists for this file
				let profileId = activeProfileId;
				const existingProfile = Array.from(profiles.values()).find(
					p => p.fileIdentifier === fileKey
				);

				if (existingProfile) {
					// Switch to existing profile instead of re-uploading
					get().switchProfile(existingProfile.id);
					return;
				}

				// Create new profile for the file
				profileId = await get().createProfile(file);

				set({ isLoading: true, error: null });

				visualizationChartStore.getState().setCurrentFileIdentifier(fileKey);

				try {
					// Parse the file
					const result = await processFile(file);

					// Analyze columns for visualization
					const columnsVisualizableStatus: ColumnVisualizableConfig[] = [];
					const processedData = { headers: result.headers, rows: result.rows as unknown as FileData };

					for (const colName of result.headers) {
						const colIndex = result.headers.indexOf(colName);
						if (colIndex === -1) continue;
						const columnData = result.rows.map((row) => row[colIndex]);
						const analysis = analyzeColumnData(columnData, colName);
						columnsVisualizableStatus.push({
							column: colName,
							isVisualizable: (analysis.isCategorical || analysis.isNumeric) && analysis.isValidForVisualization,
							uniqueValues: analysis.uniqueValues,
							totalValues: analysis.totalValues,
							reason: !analysis.isValidForVisualization
								? analysis.uniqueValues <= 1
									? "数据值单一或过少"
									: "唯一值占比过高，可能为ID列"
								: undefined,
						});
					}

					// Update the active profile with parsed data and analysis
					set((state) => {
						const newProfiles = new Map(state.profiles);
						const currentProfile = newProfiles.get(profileId);
						if (currentProfile) {
							currentProfile.rawData = result;
							currentProfile.processedData = processedData;
							currentProfile.columnAnalysis = columnsVisualizableStatus;
						}
						return {
							profiles: newProfiles,
							isLoading: false,
							// Sync derived state
							rawData: result,
							processedData: processedData,
							columnAnalysis: columnsVisualizableStatus,
						};
					});

					// Initialize visualization chart store
					visualizationChartStore.getState().initializeFileContext({
						identifier: fileKey,
						columns: result.headers,
						columnStatus: columnsVisualizableStatus,
					});

					// Sync with backend if needed
					await fetch("/api/data/upload", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(result),
					}).catch(() => {
						// Silent fail for API sync
					});
				} catch (err) {
					set({
						error: `File processing error: ${err instanceof Error ? err.message : String(err)}`,
						isLoading: false,
					});
				}
			},

			clearFile: () => {
				const { activeProfileId } = get();
				if (activeProfileId) {
					get().deleteProfile(activeProfileId);
				}
				visualizationChartStore.getState().resetCurrentFile();
			},

			clearAllFiles: () => {
				const defaultProfile = createDefaultProfile("");
				set({
					profiles: new Map(),
					activeProfileId: null,
					currentFile: null,
					currentFileIdentifier: null,
					rawData: null,
					processedData: null,
					cleanedData: null,
					columnAnalysis: [],
					duplicates: defaultProfile.duplicates,
					outliers: defaultProfile.outliers,
					isLoading: false,
					error: null,
				});
				visualizationChartStore.getState().resetCurrentFile();
			},

			// Data Processing Actions
			processAndAnalyze: async (columnsToAnalyze) => {
				const { profiles, activeProfileId } = get();
				const currentProfile = activeProfileId ? profiles.get(activeProfileId) : null;

				if (!currentProfile) {
					set({ error: "No profile selected" });
					return;
				}

				// If we already have processed data, don't reprocess
				if (currentProfile.rawData && currentProfile.processedData) {
					// But ensure visualization store is initialized
					const fileIdentifier = currentProfile.fileIdentifier;
					if (fileIdentifier && currentProfile.processedData.headers && currentProfile.columnAnalysis) {
						visualizationChartStore.getState().initializeFileContext({
							identifier: fileIdentifier,
							columns: currentProfile.processedData.headers,
							columnStatus: currentProfile.columnAnalysis,
						});
					}
					return;
				}

				// If we don't have a file object and don't have data, we can't process
				if (!currentProfile.file) {
					// Silently return - this is expected after refresh
					return;
				}

				set({ isLoading: true, error: null });

				try {
					// Parse the file if not already done
					let result = currentProfile.rawData;
					if (!result) {
						result = await processFile(currentProfile.file!);
					}

					// Analyze columns for visualization
					const columnsToProcess = columnsToAnalyze.length > 0 ? columnsToAnalyze : result.headers;
					const columnsVisualizableStatus: ColumnVisualizableConfig[] = [];

					for (const colName of columnsToProcess) {
						const colIndex = result.headers.indexOf(colName);
						if (colIndex === -1) continue;
						const columnData = result.rows.map((row) => row[colIndex]);
						const analysis = analyzeColumnData(columnData, colName);
						columnsVisualizableStatus.push({
							column: colName,
							isVisualizable: (analysis.isCategorical || analysis.isNumeric) && analysis.isValidForVisualization,
							uniqueValues: analysis.uniqueValues,
							totalValues: analysis.totalValues,
							reason: !analysis.isValidForVisualization
								? analysis.uniqueValues <= 1
									? "数据值单一或过少"
									: "唯一值占比过高，可能为ID列"
								: undefined,
						});
					}

					const processedData = { headers: result.headers, rows: result.rows as unknown as FileData };

					// Update active profile
					set((state) => {
						const newProfiles = new Map(state.profiles);
						const profile = newProfiles.get(activeProfileId!);
						if (profile) {
							profile.processedData = processedData;
							profile.columnAnalysis = columnsVisualizableStatus;
						}
						return {
							profiles: newProfiles,
							isLoading: false,
							// Sync derived state
							processedData: processedData,
							columnAnalysis: columnsVisualizableStatus,
						};
					});

					const fileIdentifier = currentProfile.fileIdentifier;
					if (fileIdentifier) {
						visualizationChartStore.getState().initializeFileContext({
							identifier: fileIdentifier,
							columns: result.headers,
							columnStatus: columnsVisualizableStatus,
						});
					}
				} catch (error: any) {
					set({
						error: error.message || "Processing failed",
						isLoading: false,
					});
					visualizationChartStore.getState().setColumnsVisualizableStatus([]);
				}
			},

			cleanData: async (operationType, params) => {
				const { processedData, cleanedData } = get();
				const dataToClean = cleanedData || processedData;

				if (!dataToClean) {
					set({ error: "No data to clean" });
					return;
				}

				set({ isLoading: true });

				try {
					// Implement cleaning logic based on operation type
					const result = { ...dataToClean };

					switch (operationType) {
						case "missing":
							// Handle missing values
							console.log(`Processing missing values for column ${params.column}`);
							break;
						case "outliers":
							// Handle outliers
							const { removeOutliers } = get();
							if (params.indices) {
								removeOutliers(params.indices);
							}
							break;
						case "duplicates":
							// Handle duplicates
							const { removeDuplicates } = get();
							if (params.indices) {
								removeDuplicates(params.indices);
							}
							break;
						default:
							throw new Error(`Unknown operation: ${operationType}`);
					}

					set({
						cleanedData: result,
						isLoading: false,
					});
				} catch (error: any) {
					set({
						error: error.message || "Cleaning failed",
						isLoading: false,
					});
				}
			},

			// Process missing values with enhanced logic
			processMissingValues: async (settings, callbacks) => {
				const { processedData, cleanedData, rawData } = get();

				// Determine the source data
				let sourceData = cleanedData || processedData;

				// If no processed data, fallback to raw data
				if (!sourceData && rawData) {
					sourceData = {
						headers: rawData.headers,
						rows: rawData.rows,
					};
				}

				if (!sourceData) {
					const error = "No data available for processing";
					set({ error });
					callbacks?.onError?.(error);
					return;
				}

				set({ isLoading: true, error: null });

				try {
					// Create a deep copy of the data
					const currentData = {
						headers: [...sourceData.headers],
						rows: JSON.parse(JSON.stringify(sourceData.rows)),
					};

					const columnKeys = Object.keys(settings);
					const totalSteps = columnKeys.length;
					let currentStep = 0;

					// Helper function to check if a cell contains missing value
					const isCellMissing = (cell: any): boolean => {
						return (
							cell === null ||
							cell === undefined ||
							cell === "" ||
							(typeof cell === "string" && cell.trim() === "") ||
							(typeof cell === "string" &&
								["na", "n/a", "null", "-", "nan"].includes(cell.trim().toLowerCase()))
						);
					};

					// Helper function to calculate statistical values
					const calculateStatistic = (values: number[], method: string): number => {
						switch (method) {
							case "mean":
								return values.reduce((a, b) => a + b, 0) / values.length;
							case "median": {
								const sorted = [...values].sort((a, b) => a - b);
								const mid = Math.floor(sorted.length / 2);
								return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
							}
							case "min":
								return Math.min(...values);
							case "max":
								return Math.max(...values);
							default:
								return 0;
						}
					};

					// Helper function to find mode (most frequent value)
					const calculateMode = (values: (string | number)[]): string | number => {
						const frequency: Record<string, number> = {};

						for (const val of values) {
							const key = String(val);
							frequency[key] = (frequency[key] || 0) + 1;
						}

						const modeEntry = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0];
						if (!modeEntry) return "";

						// Try to convert back to number if possible
						const numVal = Number(modeEntry[0]);
						return !isNaN(numVal) ? numVal : modeEntry[0];
					};

					// Process each column
					for (const column of columnKeys) {
						currentStep += 1;
						callbacks?.onProgress?.(Math.round((currentStep / totalSteps) * 100));

						const columnSetting = settings[column];
						const colIndex = currentData.headers.indexOf(column);

						if (colIndex === -1) {
							console.warn(`Column "${column}" not found in data`);
							continue;
						}

						// Count missing values before processing
						const missingCount = currentData.rows.filter((row: any[]) => isCellMissing(row[colIndex])).length;
						const totalRows = currentData.rows.length;
						const missingPercentage = totalRows > 0 ? (missingCount / totalRows) * 100 : 0;

						console.log(`Column "${column}": ${missingCount} missing values (${missingPercentage.toFixed(1)}%)`);

						if (columnSetting.strategy === "drop") {
							// Check threshold before dropping
							const threshold = Number(columnSetting.value) || 50;

							if (missingPercentage <= threshold) {
								// Drop rows with missing values
								currentData.rows = currentData.rows.filter((row: any[]) => !isCellMissing(row[colIndex]));
								console.log(`Dropped ${missingCount} rows with missing values in column "${column}"`);
							} else {
								console.warn(`Skipping drop for column "${column}" - missing percentage (${missingPercentage.toFixed(1)}%) exceeds threshold (${threshold}%)`);
							}
						} else if (columnSetting.strategy === "fill-value") {
							// Fill with specific value
							const rawValue = columnSetting.value ?? "";
							const numericValue = Number(rawValue);
							const fillValue = !isNaN(numericValue) ? numericValue : rawValue;

							currentData.rows = currentData.rows.map((row: any[]) => {
								const newRow = [...row];
								if (isCellMissing(row[colIndex])) {
									newRow[colIndex] = fillValue;
								}
								return newRow;
							});

							console.log(`Filled ${missingCount} missing values in column "${column}" with value: ${fillValue}`);
						} else if (columnSetting.strategy === "fill-method") {
							// Fill with statistical method
							const method = String(columnSetting.value || "mode");

							// Collect non-missing values
							const nonMissingValues: (string | number)[] = [];
							const numericValues: number[] = [];

							currentData.rows.forEach((row: any[]) => {
								const cell = row[colIndex];
								if (!isCellMissing(cell)) {
									nonMissingValues.push(cell);
									const num = Number(cell);
									if (!isNaN(num)) {
										numericValues.push(num);
									}
								}
							});

							let replacementValue: any = "";

							if (method === "mode" || numericValues.length === 0) {
								// Use mode for all data types or when no numeric values
								replacementValue = calculateMode(nonMissingValues);
							} else if (numericValues.length > 0) {
								// Use statistical method for numeric data
								replacementValue = calculateStatistic(numericValues, method);
							}

							// Apply replacement
							currentData.rows = currentData.rows.map((row: any[]) => {
								const newRow = [...row];
								if (isCellMissing(row[colIndex])) {
									newRow[colIndex] = replacementValue;
								}
								return newRow;
							});

							console.log(`Filled ${missingCount} missing values in column "${column}" using ${method}: ${replacementValue}`);
						}
					}

					// Update the store with cleaned data
					set({
						cleanedData: currentData,
						isLoading: false,
					});

					callbacks?.onProgress?.(100);
					callbacks?.onComplete?.();
				} catch (error: any) {
					const errorMessage = error.message || "Failed to process missing values";
					set({
						error: errorMessage,
						isLoading: false,
					});
					callbacks?.onError?.(errorMessage);
				}
			},

			// Duplicates Actions
			setDuplicatesColumns: (columns) => {
				const { profiles, activeProfileId } = get();
				if (!activeProfileId) return;

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId);
					if (profile) {
						profile.duplicates = { ...profile.duplicates, selectedColumns: columns };
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						duplicates: profile ? profile.duplicates : state.duplicates,
					};
				});
			},

			analyzeDuplicates: () => {
				const { cleanedData, processedData } = get();
				const data = cleanedData || processedData;

				if (!data) return;

				// Implement duplicate analysis logic
				// This is a placeholder - actual implementation would go here
				console.log("Analyzing duplicates...");
			},

			removeDuplicates: (indices) => {
				const { profiles, activeProfileId } = get();
				const currentProfile = activeProfileId ? profiles.get(activeProfileId) : null;
				if (!currentProfile) return;

				const data = currentProfile.cleanedData || currentProfile.processedData;
				if (!data) return;

				const newRows = data.rows.filter((_, index) => !indices.includes(index));
				const newCleanedData = {
					headers: data.headers,
					rows: newRows,
				};

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId!);
					if (profile) {
						profile.cleanedData = newCleanedData;
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						cleanedData: newCleanedData,
					};
				});
			},

			// Outliers Actions
			setOutliersColumn: (column) => {
				const { profiles, activeProfileId } = get();
				if (!activeProfileId) return;

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId);
					if (profile) {
						profile.outliers = { ...profile.outliers, columnName: column };
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						outliers: profile ? profile.outliers : state.outliers,
					};
				});
			},

			setOutliersMethod: (method, threshold) => {
				const { profiles, activeProfileId } = get();
				if (!activeProfileId) return;

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId);
					if (profile) {
						profile.outliers = { ...profile.outliers, method, threshold };
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						outliers: profile ? profile.outliers : state.outliers,
					};
				});
			},

			analyzeOutliers: () => {
				const { cleanedData, processedData, outliers } = get();
				const data = cleanedData || processedData;

				if (!data || !outliers.columnName) return;

				// Implement outlier analysis logic
				// This is a placeholder - actual implementation would go here
				console.log("Analyzing outliers...");
			},

			removeOutliers: (indices) => {
				const { profiles, activeProfileId } = get();
				const currentProfile = activeProfileId ? profiles.get(activeProfileId) : null;
				if (!currentProfile) return;

				const data = currentProfile.cleanedData || currentProfile.processedData;
				if (!data) return;

				const newRows = data.rows.filter((_, index) => !indices.includes(index));
				const newCleanedData = {
					headers: data.headers,
					rows: newRows,
				};

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId!);
					if (profile) {
						profile.cleanedData = newCleanedData;
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						cleanedData: newCleanedData,
					};
				});
			},

			// UI State Actions
			setActiveTab: (section, tab) => {
				const { profiles, activeProfileId } = get();
				if (!activeProfileId) return;

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId);
					if (profile) {
						if (section === "duplicates") {
							profile.duplicates = { ...profile.duplicates, activeTab: tab };
						} else if (section === "outliers") {
							profile.outliers = { ...profile.outliers, activeTab: tab };
						}
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						duplicates: profile ? profile.duplicates : state.duplicates,
						outliers: profile ? profile.outliers : state.outliers,
					};
				});
			},

			setExpandedGroup: (groupId) => {
				const { profiles, activeProfileId } = get();
				if (!activeProfileId) return;

				set((state) => {
					const newProfiles = new Map(state.profiles);
					const profile = newProfiles.get(activeProfileId);
					if (profile) {
						profile.duplicates = { ...profile.duplicates, expandedGroup: groupId };
					}
					return {
						profiles: newProfiles,
						// Sync derived state
						duplicates: profile ? profile.duplicates : state.duplicates,
					};
				});
			},
		}),
		{
			name: "unified-data-storage",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				activeProfileId: state.activeProfileId,
				profiles: Array.from(state.profiles.entries()).map(([key, profile]) => [
					key,
					{
						...profile,
						file: null, // Don't persist File objects
					},
				]),
			}),
			merge: (persistedState: any, currentState: UnifiedDataState): UnifiedDataState => {
				if (!persistedState?.profiles) {
					return currentState;
				}

				const profiles = new Map<string, FileProfile>(persistedState.profiles);
				const activeProfileId = persistedState.activeProfileId;
				const activeProfile: FileProfile | undefined = activeProfileId ? profiles.get(activeProfileId) : undefined;

				// Initialize visualization store if we have data
				// Use processedData if available, otherwise fall back to rawData
				const dataSource = activeProfile?.processedData || activeProfile?.rawData;
				if (activeProfile?.fileIdentifier && dataSource?.headers) {
					const columnStatus = activeProfile.columnAnalysis || [];
					setTimeout(() => {
						visualizationChartStore.getState().initializeFileContext({
							identifier: activeProfile.fileIdentifier!,
							columns: dataSource.headers,
							columnStatus: columnStatus,
						});
					}, 0);
				}

				return {
					...currentState,
					profiles,
					activeProfileId,
					// Sync derived state from active profile
					currentFile: activeProfile?.file || null,
					currentFileIdentifier: activeProfile?.fileIdentifier || null,
					rawData: activeProfile?.rawData || null,
					processedData: activeProfile?.processedData || null,
					cleanedData: activeProfile?.cleanedData || null,
					columnAnalysis: activeProfile?.columnAnalysis || [],
					duplicates: activeProfile?.duplicates || currentState.duplicates,
					outliers: activeProfile?.outliers || currentState.outliers,
				};
			},
		}
	)
);;
