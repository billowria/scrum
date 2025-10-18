// Utility functions for project management

export const formatDate = (dateString) => {
  if (!dateString) return 'No date set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'No date set';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusConfig = (status) => {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        dot: 'bg-green-500',
        label: 'Active',
        icon: '🟢'
      };
    case 'completed':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        label: 'Completed',
        icon: '🔵'
      };
    case 'archived':
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        label: 'Archived',
        icon: '⚪'
      };
    case 'on_hold':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        label: 'On Hold',
        icon: '🟡'
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        dot: 'bg-gray-500',
        label: 'Unknown',
        icon: '❓'
      };
  }
};

export const getPriorityConfig = (priority) => {
  switch (priority) {
    case 'high':
      return {
        color: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-200',
        icon: '🔴'
      };
    case 'medium':
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        icon: '🟡'
      };
    case 'low':
      return {
        color: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-200',
        icon: '🟢'
      };
    default:
      return {
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        border: 'border-gray-200',
        icon: '⚪'
      };
  }
};

export const validateProjectForm = (formData) => {
  const errors = {};

  if (!formData || !formData.name || formData.name.trim().length === 0) {
    errors.name = 'Project name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Project name must be at least 2 characters';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Project name must be less than 100 characters';
  }

  if (formData && formData.description && formData.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  if (formData && formData.start_date && formData.end_date) {
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (startDate > endDate) {
      errors.end_date = 'End date must be after start date';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSectionForm = (formData) => {
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Section name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Section name must be at least 2 characters';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Section name must be less than 100 characters';
  }

  if (formData.description && formData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTopicForm = (formData) => {
  const errors = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = 'Topic name is required';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Topic name must be at least 2 characters';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Topic name must be less than 100 characters';
  }

  if (formData.description && formData.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const reorderList = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({
    ...item,
    order_index: index
  }));
};

export const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

export const calculateProgress = (sections) => {
  if (!sections || sections.length === 0) return 0;

  let totalTopics = 0;
  let completedTopics = 0;

  sections.forEach(section => {
    if (section.project_topics) {
      totalTopics += section.project_topics.length;

      section.project_topics.forEach(topic => {
        if (topic.status === 'completed') {
          completedTopics++;
        }
      });
    }
  });

  return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
};

export const getProjectStats = (project, sections, teamMembers) => {
  const stats = {
    sectionsCount: sections?.length || 0,
    topicsCount: 0,
    contentCount: 0,
    membersCount: teamMembers?.length || 0,
    progress: 0,
    lastUpdated: project?.updated_at || project?.created_at
  };

  sections?.forEach(section => {
    if (section.project_topics) {
      stats.topicsCount += section.project_topics.length;

      section.project_topics.forEach(topic => {
        if (topic.project_topic_content) {
          stats.contentCount += topic.project_topic_content.length;
        }
      });
    }
  });

  stats.progress = calculateProgress(sections);

  return stats;
};

export const exportProjectData = (project, sections) => {
  const exportData = {
    project: {
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date,
      created_at: project.created_at,
      updated_at: project.updated_at
    },
    sections: sections?.map(section => ({
      name: section.name,
      description: section.description,
      order_index: section.order_index,
      topics: section.project_topics?.map(topic => ({
        name: topic.name,
        description: topic.description,
        order_index: topic.order_index,
        content: topic.project_topic_content?.map(content => ({
          title: content.title,
          content: content.content,
          created_at: content.created_at,
          updated_at: content.updated_at,
          created_by: content.created_by?.name
        })) || []
      })) || []
    })) || [],
    exported_at: new Date().toISOString(),
    exported_by: 'SquadSync Project Management System'
  };

  return exportData;
};

export const searchInProject = (searchTerm, project, sections) => {
  const results = [];
  const term = searchTerm.toLowerCase().trim();

  if (!term) return results;

  // Search in project name and description
  if (project.name?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term)) {
    results.push({
      type: 'project',
      title: project.name,
      description: project.description,
      id: project.id
    });
  }

  // Search in sections
  sections?.forEach(section => {
    if (section.name?.toLowerCase().includes(term) ||
        section.description?.toLowerCase().includes(term)) {
      results.push({
        type: 'section',
        title: section.name,
        description: section.description,
        id: section.id,
        sectionName: section.name
      });
    }

    // Search in topics
    section.project_topics?.forEach(topic => {
      if (topic.name?.toLowerCase().includes(term) ||
          topic.description?.toLowerCase().includes(term)) {
        results.push({
          type: 'topic',
          title: topic.name,
          description: topic.description,
          id: topic.id,
          sectionName: section.name
        });
      }

      // Search in content
      topic.project_topic_content?.forEach(content => {
        if (content.title?.toLowerCase().includes(term) ||
            content.content?.toLowerCase().includes(term)) {
          results.push({
            type: 'content',
            title: content.title,
            description: content.content,
            id: content.id,
            sectionName: section.name,
            topicName: topic.name
          });
        }
      });
    });
  });

  return results;
};