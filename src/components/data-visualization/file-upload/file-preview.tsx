"use client";

import { useUnifiedDataStore } from "@/store/unified-data-store";

export default function FilePreview() {
	// Use unified data store
	const { currentFile: file, rawData: parsedData, isLoading, error, activeProfileId } = useUnifiedDataStore();

	// Show upload message only if there's no profile at all
	if (!activeProfileId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">请先上传文件</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">加载中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-red-500">{error}</p>
			</div>
		);
	}

	if (!parsedData || parsedData.rows.length === 0) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">文件中没有数据</p>
			</div>
		);
	}

	return (
		<div className="w-full overflow-x-auto">
			<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
				<div className="w-full overflow-x-auto">
					<div className="text-xs text-gray-500 mb-4">
						显示前 {Math.min(parsedData.rows.length, 30)} 行数据，共 {parsedData.rows.length} 行
					</div>
					<div className="border rounded-md">
						<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead className="bg-gray-50 dark:bg-gray-700">
								<tr>
									{parsedData.headers.map((header, index) => (
										<th
											key={index}
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
										>
											{header || `列 ${index + 1}`}
										</th>
									))}
								</tr>
							</thead>
							<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
								{parsedData.rows.slice(0, 30).map((row, rowIndex) => (
									<tr
										key={rowIndex}
										className={
											rowIndex % 2 === 0
												? "bg-white dark:bg-gray-800"
												: "bg-gray-50 dark:bg-gray-700"
										}
									>
										{row.map((cell, cellIndex) => (
											<td
												key={cellIndex}
												className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 overflow-hidden text-ellipsis max-w-[200px]"
												title={String(cell)}
											>
												{String(cell) || "-"}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
