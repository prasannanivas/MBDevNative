import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import API_BASE_URL from '../config/api';
import COLORS from '../utils/colors';
import { formatPhoneNumber } from '../utils/phoneFormatUtils';
import { getRelativeTime } from '../utils/dateUtils';
import ReminderModal from '../components/ReminderModal';
// import FilterModal from '../components/FilterModal'; // Using inline filters now
import Header from '../components/Header';
import ClientCard from '../components/ClientCard';
import CallButtonIcon from '../components/icons/CallButtonIcon';
import AlertButtonIcon from '../components/icons/AlertButtonIcon';

const MBHomeScreen = () => {
  const { broker, authToken } = useAuth();
  const navigation = useNavigation();
  const [callRequests, setCallRequests] = useState([]);
  const [generalCallRequests, setGeneralCallRequests] = useState([]);
  const [followUpReminders, setFollowUpReminders] = useState([]);
  const [realtorNewClients, setRealtorNewClients] = useState([]);
  const [clientIntros, setClientIntros] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [recentlyAcceptedClients, setRecentlyAcceptedClients] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Today');
  // const [showFilterModal, setShowFilterModal] = useState(false); // Using inline filters now
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedInviteId, setSelectedInviteId] = useState(null);
  const [isPendingInvite, setIsPendingInvite] = useState(false);
  const [reminderContext, setReminderContext] = useState('client'); // 'client' or 'realtor'
  const [calledClients, setCalledClients] = useState(new Set());

  // Safe date parsing for iOS compatibility
  // Helper function to check if a client has any future reminders
  const hasFutureReminder = (client) => {
    if (!client.reminders || client.reminders.length === 0) return false;
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return client.reminders.some(reminder => {
      if (reminder.isActive === false) return false;
      
      const reminderDate = parseDate(reminder.date);
      if (!reminderDate) return false;
      
      reminderDate.setHours(0, 0, 0, 0);
      return reminderDate >= now; // Reminder is today or in the future
    });
  };

  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    
    // Convert string to ensure it's a string
    const dateStr = String(dateString).trim();
    
    // Month name to number mapping
    const monthMap = {
      'january': 0, 'jan': 0,
      'february': 1, 'feb': 1,
      'march': 2, 'mar': 2,
      'april': 3, 'apr': 3,
      'may': 4,
      'june': 5, 'jun': 5,
      'july': 6, 'jul': 6,
      'august': 7, 'aug': 7,
      'september': 8, 'sep': 8, 'sept': 8,
      'october': 9, 'oct': 9,
      'november': 10, 'nov': 10,
      'december': 11, 'dec': 11
    };
    
    // Try to parse common formats that iOS has trouble with
    // Format: "March 28, 2026", "Apr 17, 2026", "April17, 2026"
    const monthDayYearPattern = /^([a-zA-Z]+)\s*(\d{1,2}),?\s*(\d{4})$/;
    const match = dateStr.match(monthDayYearPattern);
    
    if (match) {
      const monthName = match[1].toLowerCase();
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      if (monthMap.hasOwnProperty(monthName)) {
        const month = monthMap[monthName];
        // Create date using UTC to avoid timezone issues
        const date = new Date(year, month, day, 0, 0, 0, 0);
        
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    // Try standard ISO format or other formats
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return new Date(); // Return current date as fallback
    }
    
    return date;
  };

  useEffect(() => {
    fetchCallRequests();
    fetchPendingInvites();
  }, [selectedFilter]);

  const fetchCallRequests = async () => {
    console.log('🔄 [MBHomeScreen] fetchCallRequests called');
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/broker-clients/${broker._id}?includeNeededDocs=false`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('=== API RESPONSE DEBUG ===');
        console.log('Selected filter:', selectedFilter);
        console.log('Raw response data assignments:', (data.assignments || []).length);
        console.log('Assignments with generalCallSchedule:', (data.assignments || []).filter(a => a.clientId?.generalCallSchedule).length);
        console.log('Assignments with active general calls:', (data.assignments || []).filter(a => 
          a.clientId?.generalCallSchedule?.isActive && !a.clientId?.generalCallSchedule?.hasMBReturnedCall
        ).length);
        console.log('==========================');
        
        // Log mbActivityStatus and documents for all clients
        if (data.assignments && data.assignments.length > 0) {
          data.assignments.forEach((assignment, index) => {
            if (assignment.clientId) {
              console.log(`🟢 [Backend] Client ${index + 1}: ${assignment.clientId.name}, mbActivityStatus: ${assignment.clientId.mbActivityStatus || 'undefined'}, documents: ${assignment.clientId.documents ? assignment.clientId.documents.length : 'undefined'}`);
            }
          });
        }

        // Extract all clients from assignments and sort by recently added
        const allClients = (data.assignments || [])
          .filter(assignment => assignment.clientId != null)
          .map(assignment => {
            const client = assignment.clientId;
            const nameParts = (client.name || '').split(' ');
            
            // Log realtor info for debugging
            console.log('Client:', client.name, 'realtorInfo:', client.realtorInfo);
            
            // Check if client has an active call request (old system)
            const hasCallRequest = client.callSchedulePreference && 
              client.callSchedulePreference.preferredDay && 
              client.callSchedulePreference.preferredTime && 
              !client.callSchedulePreference.hasCallCompleted;
            
            // Check if client has a general call request (new system)
            // Show if active, regardless of whether call was returned
            // Only hide if there's a future reminder set
            const hasGeneralCallRequest = client.generalCallSchedule &&
              client.generalCallSchedule.isActive;
            
            // Check if call was returned (completed)
            const hasReturnedCall = client.generalCallSchedule &&
              client.generalCallSchedule.hasMBReturnedCall;
            
            const mapped = {
              _id: client._id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              type: client.type || 'client',
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              requestedAt: client.generalCallSchedule?.requestedAt || client.callSchedulePreference?.scheduledAt || assignment.assignedAt,
              priority: client.status,
              callSchedulePreference: client.callSchedulePreference,
              generalCallSchedule: client.generalCallSchedule,
              hasCallRequest: hasCallRequest,
              hasGeneralCallRequest: hasGeneralCallRequest,
              hasReturnedCall: hasReturnedCall,
              reminders: client.reminders || [],
              realtorInfo: client.realtorInfo || client.assignedRealtor,
              assignedAt: assignment.assignedAt,
              mbActivityStatus: client.mbActivityStatus || 'Active',
              documents: client.documents || [],
            };
            
            console.log('🟡 [Mapped] Client:', mapped.name, 'mbActivityStatus:', mapped.mbActivityStatus, 'realtorInfo:', !!mapped.realtorInfo);
            
            return mapped;
          })
          .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt)); // Sort by most recent first
        
        // Categorize clients into different call types (exclude inactive)
        const activeClients = allClients.filter(c => c.mbActivityStatus !== 'Inactive');
        const callRequestClients = [];
        const generalCallRequestClients = [];
        const realtorClients = activeClients; // Active clients sorted by recent, with realtor info
        const introClients = [];
        
        activeClients.forEach(client => {
          // General Call Requested (new system) - only show if active AND no future reminder
          if (client.hasGeneralCallRequest && !hasFutureReminder(client)) {
            generalCallRequestClients.push(client);
          }
          // Application Call Requested (old system) - show ALL calls BUT exclude those with future reminders
          if (client.hasCallRequest && !hasFutureReminder(client)) {
            callRequestClients.push(client);
          }
        });
        
        console.log('=== CATEGORIZATION DEBUG ===');
        console.log('Active clients count:', activeClients.length);
        console.log('General call request clients:', generalCallRequestClients.length);
        console.log('Application call request clients:', callRequestClients.length);
        console.log('General call clients:', generalCallRequestClients.map(c => ({ 
          name: c.firstName + ' ' + c.lastName, 
          hasGeneral: c.hasGeneralCallRequest,
          requestedAt: c.requestedAt 
        })));
        console.log('===========================');
        
        // Apply filter to all categories
        const now = new Date();
        const applyFilter = (clients) => {
          let filtered = clients;
          
          if (selectedFilter === 'Today') {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            const endOfDay = new Date(now.setHours(23, 59, 59, 999));
            filtered = clients.filter(c => {
              const date = new Date(c.requestedAt || c.assignedAt);
              return date >= startOfDay && date <= endOfDay;
            });
          } else if (selectedFilter === 'This week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filtered = clients.filter(c => new Date(c.requestedAt || c.assignedAt) >= startOfWeek);
          } else if (selectedFilter === 'Last week') {
            const startOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay() - 7));
            const endOfLastWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            filtered = clients.filter(c => {
              const date = new Date(c.requestedAt || c.assignedAt);
              return date >= startOfLastWeek && date < endOfLastWeek;
            });
          }
          
          return filtered.sort((a, b) => new Date(b.requestedAt || b.assignedAt) - new Date(a.requestedAt || a.assignedAt));
        };

        // Extract all documents from clients and create recent documents list
        const documentsWithClients = [];
        console.log('🔍 [Documents Debug] Total clients:', allClients.length);
        
        allClients.forEach(client => {
          console.log('🔍 [Documents Debug] Client:', client.name, 'documents:', client.documents);
          if (client.documents && Array.isArray(client.documents)) {
            console.log('🔍 [Documents Debug] Client', client.name, 'has', client.documents.length, 'documents');
            client.documents.forEach(doc => {
              // Only include documents that have NOT been approved or rejected
              if (doc.status !== 'Approved' && doc.status !== 'Rejected') {
                documentsWithClients.push({
                  docType: doc.docType,
                  fileName: doc.fileName,
                  uploadedAt: doc.uploadedAt,
                  status: doc.status,
                  clientName: client.name,
                  clientId: client._id,
                });
              }
            });
          }
        });
        
        console.log('🔍 [Documents Debug] Total NEW documents found (not approved/rejected):', documentsWithClients.length);
        
        // Sort by most recent and take top 5
        const sortedDocuments = documentsWithClients.sort((a, b) => 
          new Date(b.uploadedAt) - new Date(a.uploadedAt)
        ).slice(0, 5);

        // Extract follow-up reminders (reminders with call actions)
        const followUpRemindersArray = [];
        
        // Add reminders from accepted clients
        data.assignments?.forEach((assignment) => {
          const client = assignment.clientId;
          if (!client || !client.reminders) return;
          
          client.reminders.forEach((reminder) => {
            if (reminder.isActive === false) return;
            
            // Parse the comment to extract type
            const commentParts = (reminder.comment || '').split('|~|');
            const reminderType = commentParts[0];
            const reminderNote = commentParts[1] || '';
            
            // Only include call reminders
            if (reminderType === 'Call client' || reminderType === 'Call Realtor') {
              const nameParts = (client.name || '').split(' ');
              followUpRemindersArray.push({
                _id: client._id,  // Use client ID as main ID for navigation
                reminderId: reminder._id,
                clientId: client._id,
                name: client.name,
                clientName: client.name,
                email: client.email,
                phone: client.phone,
                type: client.type || 'client',
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                callPhone: reminderType === 'Call Realtor' && client.realtorInfo?.phone 
                  ? client.realtorInfo.phone 
                  : client.phone,
                reminderDate: reminder.date,
                reminderType: reminderType,
                reminderNote: reminderNote,
                priority: client.status,
                assignedAt: assignment.assignedAt,
                mbActivityStatus: client.mbActivityStatus || 'Active',
                realtorInfo: client.realtorInfo,
                documents: client.documents || [],
                callSchedulePreference: client.callSchedulePreference,
                generalCallSchedule: client.generalCallSchedule,
                isPendingInvite: false,
                actions_taken: reminder.actions_taken || [],
              });
            }
          });
        });
        
        // Fetch pending invites and add their reminders
        try {
          const invitesResponse = await fetch(
            `${API_BASE_URL}/admin/invites/pending/${broker._id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
          
          if (invitesResponse.ok) {
            const invitesData = await invitesResponse.json();
            const invites = invitesData.invites || [];
            
            console.log('🟡 [FOLLOW UP] Processing pending invites:', invites.length);
            
            // Add reminders from pending invites
            invites.forEach((invite) => {
              if (!invite.reminders || invite.reminders.length === 0) return;
              
              invite.reminders.forEach((reminder) => {
                if (reminder.isActive === false) return;
                
                // Parse the comment to extract type
                const commentParts = (reminder.comment || '').split('|~|');
                const reminderType = commentParts[0];
                const reminderNote = commentParts[1] || '';
                
                // Only include call reminders
                if (reminderType === 'Call client' || reminderType === 'Call Realtor') {
                  const nameParts = (invite.clientName || '').split(' ');
                  followUpRemindersArray.push({
                    _id: invite._id,  // Use invite ID
                    reminderId: reminder._id,
                    clientId: invite._id,
                    name: invite.clientName,
                    clientName: invite.clientName,
                    email: invite.clientEmail,
                    phone: invite.clientPhone,
                    type: 'pending',
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    callPhone: reminderType === 'Call Realtor' && invite.realtorPhone 
                      ? invite.realtorPhone 
                      : invite.clientPhone,
                    reminderDate: reminder.date,
                    reminderType: reminderType,
                    reminderNote: reminderNote,
                    priority: 'New',
                    assignedAt: invite.createdAt,
                    mbActivityStatus: 'Pending',
                    realtorInfo: { name: invite.realtorName, phone: invite.realtorPhone },
                    documents: [],
                    isPendingInvite: true,
                    actions_taken: reminder.actions_taken || [],
                  });
                  
                  console.log('✅ [FOLLOW UP] Added pending invite reminder:', invite.clientName, 'Date:', reminder.date);
                }
              });
            });
            
            // Also update pending invites state for NEW CLIENTS section
            const sortedInvites = invites
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5);
            setPendingInvites(sortedInvites);
          }
        } catch (error) {
          console.error('❌ Error fetching pending invites for follow-up:', error);
        }
        
        // Apply Today/This Week filter to follow-up reminders
        const applyFollowUpFilter = (reminders) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let filtered = reminders.filter(r => {
            const reminderDate = parseDate(r.reminderDate);
            if (!reminderDate) return false;
            reminderDate.setHours(0, 0, 0, 0);
            return reminderDate >= today; // Only future or today reminders
          });
          
          if (selectedFilter === 'Today') {
            filtered = filtered.filter(r => {
              const reminderDate = parseDate(r.reminderDate);
              if (!reminderDate) return false;
              reminderDate.setHours(0, 0, 0, 0);
              return reminderDate.getTime() === today.getTime();
            });
          } else if (selectedFilter === 'This week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => {
              const reminderDate = parseDate(r.reminderDate);
              if (!reminderDate) return false;
              reminderDate.setHours(0, 0, 0, 0);
              return reminderDate >= startOfWeek && reminderDate <= endOfWeek;
            });
          }
          
          return filtered.sort((a, b) => {
            const dateA = parseDate(a.reminderDate);
            const dateB = parseDate(b.reminderDate);
            return dateA - dateB;
          });
        };

        // General call requests - show ALL unreturned calls (no filter applied)
        const sortedGeneralCallRequests = generalCallRequestClients.sort((a, b) => 
          new Date(b.requestedAt || b.assignedAt) - new Date(a.requestedAt || a.assignedAt)
        );
        
        console.log('=== GENERAL CALLS DEBUG ===');
        console.log('Selected Filter:', selectedFilter);
        console.log('General call request clients count:', generalCallRequestClients.length);
        console.log('Sorted general call requests:', sortedGeneralCallRequests);
        console.log('=========================');
        
        // Application calls - show ALL (including overdue) based on filter, sorted by date
        const applyApplicationFilter = (clients) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let filtered = clients.filter(c => {
            if (!c.callSchedulePreference?.preferredDay) return false;
            const callDate = parseDate(c.callSchedulePreference.preferredDay);
            return callDate !== null; // Include all valid dates (past, present, future)
          });
          
          if (selectedFilter === 'Today') {
            // Show calls scheduled for today OR overdue calls
            filtered = filtered.filter(c => {
              const callDate = parseDate(c.callSchedulePreference.preferredDay);
              if (!callDate) return false;
              callDate.setHours(0, 0, 0, 0);
              return callDate.getTime() <= today.getTime(); // Today or past
            });
          } else if (selectedFilter === 'This week') {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            filtered = filtered.filter(c => {
              const callDate = parseDate(c.callSchedulePreference.preferredDay);
              if (!callDate) return false;
              callDate.setHours(0, 0, 0, 0);
              // Include if within this week OR overdue
              return callDate <= endOfWeek;
            });
          }
          
          console.log('=== APPLICATION FILTER DEBUG ===');
          console.log('Filter:', selectedFilter);
          console.log('Total application clients before filter:', clients.length);
          console.log('Filtered application clients:', filtered.length);
          console.log('Filtered clients:', filtered.map(c => ({
            name: c.firstName + ' ' + c.lastName,
            preferredDay: c.callSchedulePreference?.preferredDay
          })));
          console.log('================================');
          
          return filtered.sort((a, b) => {
            const dateA = parseDate(a.callSchedulePreference.preferredDay);
            const dateB = parseDate(b.callSchedulePreference.preferredDay);
            return dateA - dateB; // Overdue first, then upcoming
          });
        };
        
        // Filter for recently accepted clients (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 300);
        
        const recentAccepted = allClients
          .filter(client => {
            const assignedDate = new Date(client.assignedAt);
            return assignedDate >= thirtyDaysAgo;
          })
          .map(client => ({
            _id: client._id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone,
            realtorName: client.realtorInfo?.name || 'Unknown Realtor',
            assignedAt: client.assignedAt,
            reminders: client.reminders || [],
            callSchedulePreference: client.callSchedulePreference,
            hasCallRequest: client.hasCallRequest,
            type: 'accepted'
          }))
          .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
        
        console.log('🟢 [ACCEPTED CLIENTS] Recent accepted:', recentAccepted.length);
        
        setGeneralCallRequests(sortedGeneralCallRequests);
        setCallRequests(applyApplicationFilter(callRequestClients));
        setFollowUpReminders(applyFollowUpFilter(followUpRemindersArray));
        setRealtorNewClients(realtorClients);
        setClientIntros(introClients);
        setRecentDocuments(sortedDocuments);
        setRecentlyAcceptedClients(recentAccepted);
        
        console.log('=== STATE SET DEBUG ===');
        console.log('General call requests state count:', sortedGeneralCallRequests.length);
        console.log('Application call requests count:', applyApplicationFilter(callRequestClients).length);
        console.log('=======================');
        
        console.log(`Categorized clients - General Call Requests: ${generalCallRequestClients.length}, Application Call Requests: ${callRequestClients.length}, Realtor Clients: ${realtorClients.length}, Client Intros: ${introClients.length}, Recent Documents: ${sortedDocuments.length}`);  
      }
    } catch (error) {
      console.error('Error fetching call requests:', error);
    } finally {
      setInitialLoading(false);
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPendingInvites = async () => {
    console.log('🔄 [MBHomeScreen] fetchPendingInvites called');
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/invites/pending/${broker._id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('fetchPendingInvites: received data:', data);
        
        // Sort by createdAt descending (most recent first) and take only the first 5
        const sortedInvites = (data.invites || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        
        setPendingInvites(sortedInvites);
      }
    } catch (error) {
      console.error('Error fetching pending invites:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setCalledClients(new Set()); // Clear local call tracking on refresh
    fetchCallRequests();
    fetchPendingInvites();
  };

  const handleCall = async (client) => {
    const phoneNumber = client.phone;
    const url = `tel:${phoneNumber}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Mark as called
        setCalledClients(prev => new Set([...prev, client._id]));
        
        // Send notification to client that broker called
        await fetch(
          `${API_BASE_URL}/admin/client/${client._id}/broker-call-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          }
        );
        
        // If client has an active general call request, mark it as completed
        if (client.generalCallSchedule?.isActive && !client.generalCallSchedule?.hasMBReturnedCall) {
          await fetch(
            `${API_BASE_URL}/client/${client._id}/mark-call-completed`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
          console.log('General call request marked as completed for client:', client.name);
          // Refresh the list to update UI
          setTimeout(() => {
            fetchCallRequests();
          }, 500);
        }
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
  };

  const handleFollowUpCall = async (item) => {
    const phoneNumber = item.callPhone || item.phone;
    const url = `tel:${phoneNumber}`;
    const clientId = item.clientId || item._id;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        // Mark as called in local state
        setCalledClients(prev => new Set([...prev, clientId]));
        
        // Add CALLED to actions_taken array and sync
        if (item.reminderId) {
          const entityType = item.isPendingInvite ? 'invite' : 'client';
          const entityId = item.isPendingInvite ? item._id : clientId;
          
          // Initialize actions_taken if not exists, then add CALLED
          const currentActions = item.actions_taken || [];
          if (!currentActions.includes('CALLED')) {
            currentActions.push('CALLED');
          }
          
          await fetch(
            `${API_BASE_URL}/admin/${entityType}/${entityId}/reminders/${item.reminderId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({ actions_taken: currentActions }),
            }
          );
          console.log(`✅ Reminder marked as CALLED for ${entityType} ${entityId}`);
          
          // Refresh to update UI
          setTimeout(() => {
            fetchCallRequests();
          }, 500);
        }
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } catch (error) {
      console.error('Error making follow-up call:', error);
    }
  };

  const handleReminder = (client, context = 'client') => {
    setSelectedClient(client);
    setReminderContext(context);
    setShowReminderModal(true);
  };

  const handleReminderForItem = (item) => {
    // Handle both pending invites and accepted clients
    setSelectedClient({
      _id: item._id,
      name: item.clientName,
      phone: item.clientPhone,
      email: item.clientEmail,
      reminders: item.reminders || []
    });
    setSelectedInviteId(item.type === 'pending' ? item._id : null);
    setIsPendingInvite(item.type === 'pending');
    setReminderContext('client');
    setShowReminderModal(true);
  };

  const handleClientPress = (client) => {
    navigation.navigate('ClientDetails', { client });
  };

  const renderCallRequestCard = ({ item }) => {
    const isPriority = item.priority === 'high';
    const isCalled = calledClients.has(item._id);
    const clientName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const status = isPriority ? 'Priority' : 'Active';
    const isInactive = item.mbActivityStatus === 'Inactive';
    const hasReturnedCall = item.hasReturnedCall || false;
    // Show inverted button if locally called OR database shows returned call
    const showInverted = isCalled || hasReturnedCall;

    return (
      <ClientCard
        clientName={clientName}
        status={status}
        showStatus={false}
        showInitials={true}
        timeRange={getCallTimeDisplay(item)}
        isInactive={isInactive}
        onPress={() => handleClientPress(item)}
      >
        {/* Call Button */}
        <TouchableOpacity onPress={() => handleCall(item)}>
          <CallButtonIcon bgColor="#F0913A" inverted={showInverted} />
        </TouchableOpacity>

        {/* Alert/Reminder Button */}
        <TouchableOpacity onPress={() => handleReminder(item)}>
          <AlertButtonIcon />
        </TouchableOpacity>
      </ClientCard>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {/* Blank space when no actions */}
    </View>
  );

  const renderFollowUpCard = ({ item }) => {
    const clientName = `${item.firstName || ''} ${item.lastName || ''}`.trim();
    const isInactive = item.mbActivityStatus === 'Inactive';
    const isPendingInvite = item.isPendingInvite || false;
    const isRealtorCall = item.reminderType === 'Call Realtor';
    const isCalled = calledClients.has(item.clientId);
    
    // Format display name based on reminder type
    const displayName = isRealtorCall && item.realtorInfo?.name
      ? `${item.realtorInfo.name} (${clientName})`
      : clientName;
    
    // Format reminder date display
    const getReminderTimeDisplay = () => {
      const reminderDate = parseDate(item.reminderDate);
      if (!reminderDate) return 'Scheduled';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      reminderDate.setHours(0, 0, 0, 0);
      
      const diffTime = reminderDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Tomorrow';
      } else if (diffDays > 1) {
        return `${diffDays} days`;
      }
      return 'Scheduled';
    };

    return (
      <ClientCard
        clientName={displayName}
        status={isPendingInvite ? 'Not yet Signed up' : item.reminderType}
        showStatus={true}
        showInitials={true}
        squareIcon={isRealtorCall}
        timeRange={getReminderTimeDisplay()}
        isInactive={isInactive}
        onPress={() => handleClientPress(item)}
      >
        {/* Call Button */}
        <TouchableOpacity onPress={() => handleFollowUpCall(item)}>
          <CallButtonIcon bgColor="#F0913A" inverted={isCalled} />
        </TouchableOpacity>

        {/* Alert/Reminder Button */}
        <TouchableOpacity onPress={() => {
          if (isPendingInvite) {
            handleReminderForItem({ ...item, type: 'pending', clientName: item.name });
          } else {
            handleReminder(item);
          }
        }}>
          <AlertButtonIcon />
        </TouchableOpacity>
      </ClientCard>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Get the most recent call and remaining calls
  // Check if the first call is in the future for featuring
  const isFutureCall = (call) => {
    if (!call?.callSchedulePreference?.preferredDay) return true;
    const callDate = new Date(call.callSchedulePreference.preferredDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callDate.setHours(0, 0, 0, 0);
    return callDate >= today;
  };

  // Remaining calls include all but the featured one (if featured)
  const remainingGeneralCalls = generalCallRequests;
  const remainingApplicationCalls = callRequests;
  
  console.log('=== RENDER DEBUG ===');
  console.log('generalCallRequests state:', generalCallRequests.length);
  console.log('remainingGeneralCalls:', remainingGeneralCalls.length);
  console.log('Selected filter at render:', selectedFilter);
  console.log('===================');
  
  // Featured calls for other sections
  const displayedRealtorClients = realtorNewClients.slice(0, 5); // Always show top 5 only
  
  const upcomingIntroCall = clientIntros.length > 0 ? clientIntros[0] : null;
  const remainingIntroCalls = upcomingIntroCall ? clientIntros.slice(1) : clientIntros;

  // Format time slot from callSchedulePreference
  const getTimeSlot = (call) => {
    if (!call?.callSchedulePreference?.preferredTime) return '';
    const time = call.callSchedulePreference.preferredTime;
    // Convert 09:00 to 9:00-12:00 format (assuming 3 hour window)
    const [hours, mins] = time.split(':');
    const startHour = parseInt(hours);
    const endHour = startHour + 3;
    return `${startHour}:${mins}-${endHour}:${mins}`;
  };

  // Calculate time left or date to display
  const getCallTimeDisplay = (call) => {
    // Handle completed calls (show when they were called)
    if (call?.hasReturnedCall && call?.generalCallSchedule?.calledAt) {
      const calledDate = new Date(call.generalCallSchedule.calledAt);
      const now = new Date();
      const diffMs = now - calledDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return `Called ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else if (diffHours === 0) {
        return `Called ${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else {
        return `Called ${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
      }
    }
    
    // Handle general call schedule (new system) - show when requested
    if (call?.generalCallSchedule?.requestedAt) {
      const requestedDate = parseDate(call.generalCallSchedule.requestedAt);
      if (!requestedDate) return 'Requested recently';
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      requestedDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - requestedDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Requested today';
      } else if (diffDays === 1) {
        return 'Requested yesterday';
      } else if (diffDays > 1) {
        return `Requested ${diffDays} days ago`;
      }
    }
    
    // Handle call schedule preference (old system) - show when scheduled for
    if (!call?.callSchedulePreference?.preferredDay) {
      console.log('No preferredDay found for call:', call?.name);
      return 'Call scheduled';
    }
    
    const callDate = parseDate(call.callSchedulePreference.preferredDay);
    if (!callDate) return 'Call scheduled';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    callDate.setHours(0, 0, 0, 0);
    
    const diffTime = callDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Call date:', callDate, 'Today:', today, 'Diff days:', diffDays);
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === 2) {
      return '2 days left';
    } else if (diffDays === 3) {
      return '3 days left';
    } else if (diffDays > 0 && diffDays <= 3) {
      return `${diffDays} days left`;
    } else if (diffDays < 0) {
      // Overdue
      const overdueDays = Math.abs(diffDays);
      return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
    } else {
      // Format as "Mar 10, 2026"
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return callDate.toLocaleDateString('en-US', options);
    }
  };

  // Format recently assigned date
  const getAssignedTimeDisplay = (assignedAt) => {
    if (!assignedAt) return 'Recently added';
    return getRelativeTime(assignedAt);
  };

  const getSignedUpTimeDisplay = (timestamp, type) => {
    // For pending invites
    if (type === 'pending') return 'Not yet Signed up';
    
    // For accepted clients
    if (!timestamp) return 'Recently signed up';
    const signedUpDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    signedUpDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - signedUpDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Signed Up Today';
    if (diffDays === 1) return 'Signed Up yesterday';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(timestamp);
    return `Signed Up on ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* CALL REQUESTED SECTION (General Call Schedule) */}

        {remainingGeneralCalls.length > 0 ? (
          <>
            <View style={[styles.titleContainer, { backgroundColor: remainingGeneralCalls.length > 0 ? '#F0913A4D' : '#4CAF504D' }]}>
          <Text style={styles.sectionTitleCR}>CALL REQUESTED</Text>
        </View>
          
          <View style={[styles.featuredCallSection, { backgroundColor: '#F0913A4D' }]}>
            {remainingGeneralCalls.map((item) => (
              <View key={item._id} style={styles.callItem}>
                {renderCallRequestCard({ item })}
              </View>
            ))}
          </View>
          </>
        ) : (
          <View style={[styles.emptyFeaturedSection, { backgroundColor: '#CDDCDC' }]}>
            <View style={styles.emptyFeaturedCardInner}>
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.emptyFeaturedText}>You have no calls requested</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.timeFilterRow}>
          <Text style={styles.timeSlot}>CALLS</Text>
          <View style={styles.inlineFilterButtons}>
            <TouchableOpacity
              style={[styles.inlineFilterButton, selectedFilter === 'Today' && styles.inlineFilterButtonActive]}
              onPress={() => setSelectedFilter('Today')}
            >
              <Text style={[styles.inlineFilterButtonText, selectedFilter === 'Today' && styles.inlineFilterButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.inlineFilterButton, selectedFilter === 'This week' && styles.inlineFilterButtonActive]}
              onPress={() => setSelectedFilter('This week')}
            >
              <Text style={[styles.inlineFilterButtonText, selectedFilter === 'This week' && styles.inlineFilterButtonTextActive]}>
                This Week
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        
        {/* APPLICATION SECTION (Old Call Schedule Preference) */}
        <>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>APPLICATION</Text>
          </View>
          
          {remainingApplicationCalls.length > 0 ? (
            <>
              {remainingApplicationCalls.map((item) => (
                <View key={item._id} style={styles.callItem}>
                  {renderCallRequestCard({ item })}
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyApplicationSection}>
              <View style={styles.emptyApplicationCard}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.emptyApplicationText}>
                    {selectedFilter === 'Today' 
                      ? 'You have no Application calls today'
                      : 'You have no Application calls this week'}
                  </Text>
                )}
              </View>
            </View>
          )}
        </>

        {/* FOLLOW UP SECTION (Call Reminders) */}
        <>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>FOLLOW UP</Text>
          </View>
          
          {followUpReminders.length > 0 ? (
            <>
              {followUpReminders.map((item) => (
                <View key={item.reminderId} style={styles.callItem}>
                  {renderFollowUpCard({ item })}
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyApplicationSection}>
              <View style={styles.emptyApplicationCard}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.emptyApplicationText}>
                    {selectedFilter === 'Today' 
                      ? 'You have no follow-up calls today'
                      : 'You have no follow-up calls this week'}
                  </Text>
                )}
              </View>
            </View>
          )}
        </>

        {/* REALTOR - NEW CLIENT SECTION */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>REALTOR - NEW CLIENT</Text>
        </View>
        
        {displayedRealtorClients.length > 0 ? (
          <>
            {displayedRealtorClients.map((item) => {
              const isInactive = item.mbActivityStatus === 'Inactive';
              console.log('🔵 [Render] Realtor Client:', item.name, 'mbActivityStatus:', item.mbActivityStatus, 'isInactive:', isInactive);
              
              return (
              <View key={item._id} style={styles.callItem}>
                <ClientCard
                  clientName={item.realtorInfo?.name 
                    ? `${item.realtorInfo.name} (${item.firstName || ''} ${item.lastName || ''})`.trim()
                    : `${item.firstName || ''} ${item.lastName || ''} (No realtor)`.trim()}
                  status={''}
                  showStatus={false}
                  showInitials={true}
                  squareIcon={true}
                  timeRange={getAssignedTimeDisplay(item.assignedAt)}
                  isInactive={isInactive}
                  onPress={() => navigation.navigate('RealtorDetails', { client: item })}
                >
                  <TouchableOpacity onPress={() => {
                    if (item.realtorInfo?.phone) {
                      handleCall({ phone: item.realtorInfo.phone, _id: item.realtorInfo._id });
                    } else {
                      handleCall(item);
                    }
                  }}>
                    <CallButtonIcon bgColor="#F0913A" inverted={calledClients.has(item.realtorInfo?._id || item._id)} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleReminder(item, item.realtorInfo?.name ? 'realtor' : 'client')}>
                    <AlertButtonIcon />
                  </TouchableOpacity>
                </ClientCard>
              </View>
            );
            })}
          </>
        ) : (
          <View style={styles.emptyFeaturedCard}>
            <Text style={styles.emptyFeaturedText}>No clients assigned yet</Text>
          </View>
        )}


        {/* NEW CLIENTS SECTION (Pending Invites + Recently Accepted) */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>NEW CLIENTS</Text>
        </View>

        {(() => {
          // Combine pending invites and recently accepted clients
          const allNewClients = [
            ...pendingInvites.map(invite => ({
              ...invite,
              type: 'pending',
              timestamp: invite.createdAt
            })),
            ...recentlyAcceptedClients.map(client => ({
              ...client,
              type: 'accepted',
              timestamp: client.assignedAt
            }))
          ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Apply priority logic: exclude clients that are in Follow-up or Application
          const filteredNewClients = allNewClients.filter(item => {
            // For pending invites, check if they have future reminders
            if (item.type === 'pending') {
              if (hasFutureReminder(item)) {
                console.log('📌 [New Clients] Excluding pending invite with future reminder:', item.clientName);
                return false;
              }
              return true;
            }
            
            // For accepted clients, check priorities using the full client data
            // Priority 1: Exclude if has future reminder (should be in Follow-up)
            if (hasFutureReminder(item)) {
              console.log('📌 [New Clients] Excluding client with future reminder:', item.clientName);
              return false;
            }
            
            // Priority 2: Exclude if in Application (has callSchedulePreference)
            if (item.hasCallRequest || item.callSchedulePreference?.preferredDay) {
              console.log('📌 [New Clients] Excluding client in Application:', item.clientName);
              return false;
            }
            
            // Priority 3: Show in New Clients
            return true;
          });

          return filteredNewClients.length > 0 ? (
            filteredNewClients.map((item) => (
              <ClientCard
                key={item._id}
                clientName={item.clientName}
                realtorName={item.realtorName}
                timeRange={getSignedUpTimeDisplay(item.timestamp, item.type)}
                showStatus={false}
              >
                {/* Show Call + Set Reminder buttons for both pending invites and accepted clients */}
                <View style={styles.newClientActions}>
                  {/* Call button - grey out if no phone */}
                  {item.clientPhone ? (
                    <TouchableOpacity
                      onPress={() => handleCall({
                        _id: item._id,
                        name: item.clientName,
                        phone: item.clientPhone
                      })}
                    >
                      <CallButtonIcon bgColor="#F0913A" inverted={calledClients.has(item._id)} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ opacity: 0.3 }}>
                      <CallButtonIcon bgColor="#CCCCCC" />
                    </View>
                  )}
                  
                  {/* Set Reminder button */}
                  <TouchableOpacity
                    onPress={() => handleReminderForItem(item)}
                  >
                    <AlertButtonIcon />
                  </TouchableOpacity>
                </View>
              </ClientCard>
            ))
          ) : (
            <View style={styles.emptyFeaturedCard}>
              <Text style={styles.emptyFeaturedText}>No new clients</Text>
            </View>
          );
        })()}

        {/* NEW DOCUMENTS SECTION */}
        <View style={styles.titleContainer}>
          <Text style={styles.sectionTitle}>NEW DOCUMENTS</Text>
        </View>

        {recentDocuments.length > 0 ? (
          recentDocuments.map((doc, index) => (
            <View key={`${doc.clientId}-${index}`} style={styles.documentItem}>
              <View style={styles.documentContent}>
                <Text style={styles.documentName}>{doc.docType}</Text>
                <Text style={styles.documentArrow}>→</Text>
                <Text style={styles.documentClientName}>{doc.clientName}</Text>
              </View>
              <Text style={styles.documentTime}>
                {new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyFeaturedCard}>
            <Text style={styles.emptyFeaturedText}>No new documents pending review</Text>
          </View>
        )}
      </ScrollView>

      {/* Filter Modal - Commented out, using inline filters now
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedFilter={selectedFilter}
        onSelectFilter={(filter) => {
          setSelectedFilter(filter);
          setShowFilterModal(false);
        }}
      />
      */}

      {/* Reminder Modal */}
      {selectedClient && (
        <ReminderModal
          visible={showReminderModal}
          onClose={() => {
            setShowReminderModal(false);
            setSelectedClient(null);
            setSelectedInviteId(null);
            setIsPendingInvite(false);
            setReminderContext('client');
          }}
          client={selectedClient}
          sourceScreen="MBMain"
          defaultReminderType={reminderContext === 'realtor' ? 'Call Realtor' : 'Call client'}
          inviteId={selectedInviteId}
          isPendingInvite={isPendingInvite}
          onSuccess={() => {
            console.log('🔄 [MBHomeScreen] onSuccess called - refreshing client list');
            // Refresh the client list after setting reminder or inactive status
            fetchCallRequests();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bellButton: {
    padding: 8,
  },
  sectionTitleCR: {
    color: "#202020",
    fontWeight: '700',
    fontSize: 11, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    // backgroundColor: '#F0913A4D',
  },
  featuredCallSection: {
    marginBottom: 16,
    backgroundColor: '#F0913A4D',
    paddingBottom: 16,
  },
  timeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
  },
  timeSlot: {
    fontSize: 11,
    fontFamily:"futura",
    fontWeight: '700',
    color: '#797979',
    fontFamily: 'futura',
  },
  inlineFilterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineFilterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#377473',
    backgroundColor: 'transparent',
  },
  inlineFilterButtonActive: {
    backgroundColor: '#377473',
  },
  inlineFilterButtonText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#377473',
    fontFamily: 'futura',
  },
  inlineFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  callItem: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: "#797979",
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'futura',
    paddingLeft: 4,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#377473',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    color: '#377473',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'futura',
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.orange,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.slate,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 13,
    color: COLORS.slate,
  },
  rightSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: COLORS.green,
  },
  calledButton: {
    backgroundColor: COLORS.blue,
  },
  reminderButton: {
    backgroundColor: COLORS.green,
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: COLORS.slate,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.slate,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCallsSection: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyCallsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  emptyFeaturedSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  emptyFeaturedCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFeaturedCardInner: {
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyFeaturedText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'futura',
  },
  emptyApplicationSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  emptyApplicationCard: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyApplicationText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'futura',
  },
  realtorContactSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  realtorContactContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  realtorProfileIcon: {
    width: 49,
    height: 49,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realtorInitials: {
    fontFamily: 'futura',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 27,
    color: '#FDFDFD',
    textAlign: 'center',
  },
  realtorInfoSection: {
    flex: 1,
    gap: 4,
  },
  realtorContactTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate,
    marginBottom: 4,
    fontFamily: 'futura',
  },
  realtorContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  realtorContactText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
    fontFamily: 'futura',
  },
  documentItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    fontFamily: 'futura',
  },
  documentArrow: {
    fontSize: 16,
    color: COLORS.slate,
    marginHorizontal: 8,
    fontFamily: 'futura',
  },
  documentClientName: {
    fontSize: 16,
    color: COLORS.slate,
    fontFamily: 'futura',
  },
  documentTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'futura',
  },
  inviteItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteContent: {
    marginBottom: 8,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteRealtorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    fontFamily: 'futura',
  },
  inviteStatusBadge: {
    backgroundColor: '#F0913A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviteStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    fontFamily: 'futura',
  },
  inviteClientName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.slate,
    marginBottom: 4,
    fontFamily: 'futura',
  },
  inviteDetail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
    fontFamily: 'futura',
  },
  inviteTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'futura',
  },
  // New Clients badge styles
  newClientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newClientActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  callRealtorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#377473',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  callRealtorButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'futura',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeAccepted: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'futura',
    letterSpacing: 0.5,
  },
  statusBadgeTextPending: {
    color: '#F57C00',
  },
  statusBadgeTextAccepted: {
    color: '#2E7D32',
  },
});

export default MBHomeScreen;
