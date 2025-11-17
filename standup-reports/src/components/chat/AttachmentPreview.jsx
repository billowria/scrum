import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiImage, FiFile, FiX, FiDownload } from 'react-icons/fi';

const AttachmentPreview = ({
  attachments = [],
  onRemove,
  className = ''
}) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <FiImage className="w-5 h-5" />;
    return <FiFile className="w-5 h-5" />;
  };

  const getFileColor = (type) => {
    if (type?.startsWith('image/')) return 'from-blue-500 to-purple-600';
    if (type?.startsWith('video/')) return 'from-red-500 to-pink-600';
    if (type?.includes('pdf')) return 'from-red-600 to-red-700';
    if (type?.includes('zip') || type?.includes('rar')) return 'from-yellow-500 to-orange-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <AnimatePresence>
      {attachments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`border-b border-gray-200 bg-gray-50/80 ${className}`}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-500 px-2">
                {attachments.length} {attachments.length === 1 ? 'Attachment' : 'Attachments'}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="grid gap-2">
              {attachments.map((attachment, index) => (
                <motion.div
                  key={attachment.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200
                           hover:shadow-md transition-all duration-200 group"
                >
                  {/* File Icon/Preview */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br
                                  ${getFileColor(attachment.type)}
                                  flex items-center justify-center text-white shadow-sm`}>
                    {attachment.type?.startsWith('image/') && attachment.preview ? (
                      <img
                        src={attachment.preview}
                        alt={attachment.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      getFileIcon(attachment.type)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.size && formatFileSize(attachment.size)}
                      {attachment.type && ` • ${attachment.type.split('/')[1]?.toUpperCase()}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100
                                  transition-opacity duration-200">
                    {attachment.url && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50
                                 rounded-lg transition-colors"
                        title="Download"
                      >
                        <FiDownload className="w-4 h-4" />
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemove(attachment.id || index)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50
                               rounded-lg transition-colors"
                      title="Remove"
                    >
                      <FiX className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AttachmentPreview;