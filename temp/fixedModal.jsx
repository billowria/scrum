{/* Fullscreen Modal */}
<AnimatePresence>
  {showFullscreenModal && (
    <motion.div
      className="fixed inset-0 bg-black/95 z-50 p-6 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={closeFullscreenModal}
    >
      <motion.button
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={closeFullscreenModal}
      >
        <FiX className="h-6 w-6" />
      </motion.button>
      
      <div 
        className="w-full max-w-5xl mx-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {filteredReports.length > 0 && (
          <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={currentReportIndex}
                custom={slideDirection}
                initial={(direction) => ({
                  x: direction === 'right' ? '100%' : '-100%',
                  opacity: 0
                })}
                animate={{
                  x: 0,
                  opacity: 1
                }}
                exit={(direction) => ({
                  x: direction === 'right' ? '-100%' : '100%',
                  opacity: 0
                })}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8
                }}
                className="p-8"
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                {/* Current report content */}
                <div className="flex items-center gap-5 mb-8 pb-5 border-b border-gray-200">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl shadow-md">
                    {filteredReports[currentReportIndex].users?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{filteredReports[currentReportIndex].users?.name || 'Unknown User'}</h3>
                    <div className="text-gray-500 flex items-center gap-3 text-lg">
                      <span className="font-medium">{filteredReports[currentReportIndex].users?.teams?.name || 'Unassigned'}</span>
                      <span>&bull;</span>
                      <span className="flex items-center">
                        <FiClock className="mr-1.5" />
                        {filteredReports[currentReportIndex].created_at 
                          ? format(parseISO(filteredReports[currentReportIndex].created_at), 'MMM d, h:mm a') 
                          : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-auto text-sm bg-primary-50 text-primary-700 rounded-full px-4 py-1 border border-primary-100">
                    Report {currentReportIndex + 1} of {filteredReports.length}
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-primary-50 rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border border-primary-100">
                    <h4 className="font-semibold text-primary-700 mb-4 flex items-center text-xl border-b border-primary-100 pb-3">
                      <span className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                      Yesterday
                    </h4>
                    <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                      {filteredReports[currentReportIndex].yesterday || <span className="italic text-gray-400">No update provided</span>}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border border-green-100">
                    <h4 className="font-semibold text-green-700 mb-4 flex items-center text-xl border-b border-green-100 pb-3">
                      <span className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                      Today
                    </h4>
                    <div className="text-gray-700 flex-1 overflow-y-auto custom-scrollbar px-1 prose">
                      {filteredReports[currentReportIndex].today || <span className="italic text-gray-400">No update provided</span>}
                    </div>
                  </div>
                  
                  <div className={`rounded-xl p-6 shadow-sm h-[300px] flex flex-col hover:shadow-md transition-all duration-300 border ${filteredReports[currentReportIndex].blockers ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                    <h4 className={`font-semibold mb-4 flex items-center text-xl pb-3 border-b ${filteredReports[currentReportIndex].blockers ? 'text-red-700 border-red-100' : 'text-gray-700 border-gray-200'}`}>
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold ${filteredReports[currentReportIndex].blockers ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>3</span>
                      Blockers
                    </h4>
                    <div className={`flex-1 overflow-y-auto custom-scrollbar px-1 prose ${filteredReports[currentReportIndex].blockers ? 'text-red-700' : 'text-green-700'}`}>
                      {filteredReports[currentReportIndex].blockers || <span className="italic text-gray-400">No blockers reported</span>}
                    </div>
                  </div>
                </div>
                
                {/* Navigation indicator */}
                <div className="flex items-center justify-center mt-8 gap-2">
                  {filteredReports.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-3 rounded-full transition-all cursor-pointer hover:scale-110 ${idx === currentReportIndex ? 'bg-primary-500 w-8' : 'bg-gray-300 w-3 hover:bg-gray-400'}`}
                      onClick={() => setCurrentReportIndex(idx)}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Left/Right Buttons for Navigation */}
            {filteredReports.length > 1 && (
              <>
                <button 
                  className={`absolute left-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                  onClick={prevReport}
                  disabled={currentReportIndex === 0}
                >
                  <FiChevronLeft size={28} />
                </button>
                <button 
                  className={`absolute right-5 top-1/2 transform -translate-y-1/2 p-4 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600 hover:bg-primary-100 hover:text-primary-700 transition-colors shadow-lg hover:shadow-xl ${currentReportIndex === filteredReports.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                  onClick={nextReport}
                  disabled={currentReportIndex === filteredReports.length - 1}
                >
                  <FiChevronRight size={28} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence> 